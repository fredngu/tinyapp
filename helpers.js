const generateRandomString = function() {
  return Math.random().toString(20).substring(2, 8);
};

const getUserByEmail = function(email, userObj) {
  for (const user in userObj) {
    if (userObj[user]["email"] === email) {
      return userObj[user]["id"];
    }
  }
};

const urlsForUser = function(id, urlObj) {
  let urls = {};
  for (const keys in urlObj) {
    if (urlObj[keys]["userID"] === id) {
      urls[keys] = urlObj[keys]; 
    }
  }
  return urls;
} 

module.exports = {
  getUserByEmail,
  generateRandomString,
  urlsForUser
}