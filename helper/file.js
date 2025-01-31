const fs = require("fs");

const deleteFile = function (filePath) {
  fs.unlink(filePath, (err) => {
    if (err) throw err;
  });
};

exports.deleteFile = deleteFile;
