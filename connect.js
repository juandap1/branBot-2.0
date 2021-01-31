var mysql = require('mysql');

exports.establishConnect = function () {
  var connection = mysql.createConnection({
      host: 'localhost',
      port: '3306',
      database: 'musicbot',
      user: 'root',
      password: 'Blueninja123'
  });
  return connection;
};
