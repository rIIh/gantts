declare module 'typescript' {
  interface String {
    asNumber(this: String): number;
  }
}

String.prototype.asNumber = function(this: String) {
  return parseFloat(this);
};
