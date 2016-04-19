function Item() {

}

Item.prototype.run = function run() {
  throw new Error('Method "run" of Item must be overridden');
};

module.exports = Item;
