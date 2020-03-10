const request = require('request');
const cheerio = require('cheerio');
const { parentPort } = require('worker_threads');
const Urls = require('./model/urls')

parentPort.on('message', (url) => {
    request(url, (error, response, html) => {
        if(
            !error && response.statusCode > 200 ||
            !error && response.statusCode < 300
        ){
            const $ = cheerio.load(html)

            let footer = $('footer').text().toLowerCase().replace(/\s/g,'')
            if(footer.length > 0){
                const info = cases(footer, url)

                if(info.firstDate !== '' || info.secondDate !== ''){
                    console.log(info)
                    save(info)
                    return false
                }
            }

            footer = $('[id*=footer]').text().toLowerCase().replace(/\s/g,'')
            if(footer.length > 0){
                const info = cases(footer, url)
                if(info.firstDate !== '' || info.secondDate !== ''){
                    console.log(info)
                    save(info)
                    return false
                }
            }

            footer = $('[class*=footer]').text().toLowerCase().replace(/\s/g,'')
            if(footer.length > 0) {
                const info = cases(footer, url)
                if(info.firstDate !== '' || info.secondDate !== ''){
                    console.log(info)
                    save(info)
                    return false
                }
            }
            else {
                const info = cases(footer, url)
                console.log(info)
                parentPort.postMessage({status: true})
            }
        }
        else {
            console.log(`request ------------ error -------------------> ${url}`)
            parentPort.postMessage({status: true})
        }
    })
})

const now = new Date().getFullYear();
function logic(numbers, url, text){
    numbers = filter(numbers, text);

    if(numbers.length == 2){
        if(parseInt(numbers[1].year) !== now) {
            const first = numbers[0].year;
            const second = numbers[1].year;
            return collection(url, `In your website outdated copyright date, please update ${first} to ${second}`, first, second)
        }else {
            parentPort.postMessage({status: true})
        }
    }
    else if(numbers.length == 1 && parseInt(numbers[0].year) !== now) {
        const { year } = numbers[0];
        return collection(url, `In your website outdated copyright date, please update ${year} to ${now}`, year)
    }
    else if(numbers.length == 0){
        return collection(url, `you haven't any information about the copyright date in your website`)
    }
    else {
        parentPort.postMessage({status: true})
    }
}
function cases(footer, url) {
    const numbers = createNumbers(footer)
    const mainIndex = footer.indexOf('copyright');
    const iconIndex = footer.indexOf('©');

    if(mainIndex !== -1 || iconIndex !== -1){
        if(numbers.length !== 0){
            return logic(numbers, url, footer)
        }else {
            parentPort.postMessage({status: true})
        }
    } else if(numbers.length !== 0){
        return logic(numbers, url, footer)
    } else {
        parentPort.postMessage({status: true})
    }
}
function save(info){
    Urls.create({...info})
        .then(result => {
            console.log('save ----------')
            parentPort.postMessage({status: true})
        })
        .catch(error => {
            console.log('error ----------')
            parentPort.postMessage({status: true})
        })
}
function filter(numbers, text) {
    numbers = numbers.filter(elem => {
        const { index, year } = elem;
        if(year > '1900' && year <= now && year.length === 4){
            return { index, year }
        }
    })
    if(numbers.length > 1) {
        numbers = numbers.filter((elem, i) => {
            let next;
            if(numbers[i + 1] === undefined){
                next = numbers[numbers.length - 1]
            } else {
                next = numbers[i + 1]
            }

            if(
                elem.index < next.index &&
                elem.year < next.year &&
                elem.year > '1900' && next.year <= '2020'
            ){
                return elem
            }else if(
                i != 0 &&
                numbers[i - 1].index < elem.index &&
                numbers[i - 1].year < elem.year
            ) {
                return elem
            }
        })
    }
    else if(numbers.length == 1){
        const checkIfDateShowInPageUseJs = text.split(numbers[0].year)
        if(checkIfDateShowInPageUseJs.length > 0 && checkIfDateShowInPageUseJs[1][0] == '-'){
            numbers = []
        }
    }
    else {
        numbers = []
    }
    return numbers
}
function createNumbers(text) {
    let result;
    const regex = /\d+/gi, numbers = [];
    while (result = regex.exec(text)) {
        numbers.push({
            index: result['index'],
            year: result[0]
        });
    }
    return filter(numbers, text);
}
function collection(url, message, firstDate = '', secondDate = ''){
    const info = {
        url, message, firstDate, secondDate
    }
    return info
}
