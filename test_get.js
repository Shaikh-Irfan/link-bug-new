const http = require('http');

async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/records?user=Irfan&date=01/06/2026");
    const json = await res.json();
    console.log(json.records.aiDate);
  } catch (err) {
    console.error(err);
  }
}
test();
