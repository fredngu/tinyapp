//Create random 6-char string
const generateRandomString = function() {
  return Math.random().toString(20).substring(2, 8);
};

//Return id for corresponding email
const getUserByEmail = function(email, userObj) {
  for (const user in userObj) {
    if (userObj[user]["email"] === email) {
      return userObj[user]["id"];
    }
  }
};

//Return obj with urls for an ID
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