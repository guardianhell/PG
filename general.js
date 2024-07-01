async function numberGenerator(numOfDigits, number) {
  var zerodigits = numOfDigits - number.toString().length;
  var digits = "";
  for (i = 0; i < zerodigits; i++) {
    digits = digits + "0";
  }

  digits = digits + number.toString();
  return digits;
}

module.exports.numberGenerator = numberGenerator;
