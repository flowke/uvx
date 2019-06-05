

module.exports = (obj)=>{
  let val = {
    keys: [],
    values: []
  }
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const elt = obj[key];
      val.keys.push(key);
      val.values.push(elt);
    }
  }
  return val;
}