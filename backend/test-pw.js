const sqlite3 = require('@libsql/sqlite3').verbose();
const bcrypt = require('bcryptjs');
const db = new sqlite3.Database('libsql://gwe-db-peachyanakornbunpanuk-bit.aws-ap-northeast-1.turso.io?authToken=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQxNjkwNTQsImlkIjoiMDE5ZjYzOTMtODkwMS03NmEzLThlYTMtY2RiOWU3NzkxYzBmIiwia2lkIjoiS2JJWnlLVGx5NGhzWWZxWEJMcUtnQlhBbng1ZUZpSzI2ZXlWR3NPMGl6WSIsInJpZCI6IjA1YjU3OGY5LTYyOTUtNGY4Yy04YTM4LTQxOTEyMjQ3ZWNmOSJ9.GBRMu82GewmEsy620qxxX7jeE4Yt1S1nZKIFs_pa2RA2DpKfx1pfUNjzMSbtVABNHLOfLfx2EuVqPX2IRr18Aw');
db.get("SELECT password FROM users WHERE username = 'IT'", async (err, user) => {
  console.log(user);
  console.log('Match IT123:', await bcrypt.compare('IT123', user.password));
  console.log('Match admin:', await bcrypt.compare('admin', user.password));
});
