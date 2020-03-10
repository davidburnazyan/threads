const fs = require('fs');
const db = require('./config/database');
const { Worker } = require('worker_threads');

const file = fs.readFileSync('data-1583332592720.csv','utf8');

db.authenticate()
    .then(() => console.log('connected'))
    .catch((error) => console.error(error))

let urls = file.split(/\s+/)
urls.length = 200;

// setMaxListeners(15)
let n = 0;
const threads = (i) => {
   if(urls.length > n) {
       n++
       const work = new Worker(require.resolve('./work.js'))
       work.postMessage(u(urls[n]))

       work.on("message", ({status}) => {
           if(status && urls.length > n){
               ++n
               work.postMessage(u(urls[n]))
           }
       })
       work.on("error", error => {
           console.log(`Event error #####################################################`)
       })
       work.on("exit", exit => {
           if(urls.length > n && exit === 0) {
               threads(i)
           } else {
               console.log(exit)
           }
       })
   }
}

for(let i = 0; i < 20; i++) {
    threads(i)
}

function u(item) {
    return `http://${item}`
}
