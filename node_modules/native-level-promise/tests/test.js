const LevelPromise = require("../");

// This is a VERY basic test, that isn't a real test using y'all's fancy 
// tools, I haven't gotten to that part yet!

const lp = new LevelPromise('hallo');

const test = async() => {
  await lp.put('hallo', 'hehe');
  const rv = await lp.get('hallo');
  console.log(rv);
  
  const output = [];
  lp.keyStream()
    .on("data", key => lp.get(key).then(d => output.push(d)))
    .on("end", async () => {
      console.dir(output);
      await lp.close();
      lp.destroy();
    });
};

test();
