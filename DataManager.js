const fs = require('fs');
const date = new Date();
const jsonPath = './data/data.json';
const logPath = './data/log.txt';
let jsonData;  // use getJSON() to get this value



module.exports.initialize = () => {
    fs.access(jsonPath, (err) => {
        if(!err) {  // read json
          jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        } else {  // if there's no json, make it
          jsonData = {  // initial form of the json structure
            'dashboard': {
              'resinTimer': {
                'lastSetTime': getTime(),
                'lastRemainedTime': '00:00:00'  // remained time at lastSetTime
              }
            },
            'check-in': {},
            'map': {},
            'guide': {},
            'setting': {
              'serverRegion': 'Asia'  // default server region is Asia
            }
          }
          this.save();
          return this;
        }
      });
}

// Query form : q('key1/key2/···/keyn')
module.exports.query = (path) => {
    let keys = path.split('/');
    let value = jsonData;
    keys.forEach(key => {
      value = value[key];
    });
    return value;
  }

module.exports.save = () => {  // non-sync
    fs.writeFile(jsonPath, JSON.stringify(jsonData), 'utf-8', (err) => {
      if(err) {
        console.log("Failed to save json data. If this continuously cause, please check the log");
        this.log(err);
      }
    });
    return this;
  }

module.exports.log = (msg) => {  // non-sync
    fs.access(logPath, (err) => {
      if(err) {
        fs.writeFileSync(logPath, "### Pocket Genshiner Log File ###\nPlease send this log file to [foresthouse2316@gmail.com] if there is any bug or problem.\n", (err) =>{
          console.log("Cannot create log.txt");
        });
      }
    });
    fs.appendFile(logPath,  '\n[' + getTimeStamp() + ']    ' + msg, (err) => {
        if(err){
            console.log("Cannot add a log to log.txt");
        }
    });
    return this;
  }
  

  
  function getTimeStamp() {  // YY/MM/DD hh:mm:ss GMT±0000
    return date.getFullYear().toString() + '/' + (date.getMonth()+1).toString() + '/' + date.getDate().toString() + ' ' + date.toTimeString().toString().split(' (')[0];
  }
  function getTime() {  // from 1970.1.1
    return date.getTime();
  }
  
  function calcTimeGap(t1, t2=getTime(), abs=true) {  // [t1] to [t2] calculation
    pn = t2 > t1 ? 1 : -1;
    diff = MAth.abs(Math.round((t2 - t1) / 1000));  // millisec to sec with rounding off
    // 3600s = 1h, 60s = 1m
    s = diff % 60;
    diff = parseInt(diff / 60);  // now diff mean "minute"
    m = diff % 60;
    h = parseInt(diff / 60);
    return abs ? [h, m, s] : [h, m, s, pn];
  }