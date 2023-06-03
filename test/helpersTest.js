const { assert } = require('chai');

const { getUserByEmail, urlsForUser } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

const testUrlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
  asl1o2: {
    longURL: "https://www.youtube.com",
    userID: "1k20aj"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    assert.equal(user, expectedUserID)
  });
  it('should return undefined with email not in database', function() {
    const user = getUserByEmail("fake@example.com", testUsers)
    const expectedOutcome = undefined
    assert.equal(user, expectedOutcome)
  })
});

describe('urlsForUser', function() {
  it('should return an object of URLs', function() {
    const urls = urlsForUser("aJ48lW", testUrlDatabase)
    const expectedUserURLS = {
      b6UTxQ: { longURL: 'https://www.tsn.ca', userID: 'aJ48lW' },
      i3BoGr: { longURL: 'https://www.google.ca', userID: 'aJ48lW' }
    }
    assert.deepEqual(urls, expectedUserURLS)
  });
  it('should return empty object when ID not in url database', function() {
    const urls = urlsForUser("lq141a", testUrlDatabase)
    const expectedOutcome = {}
    assert.deepEqual(urls, expectedOutcome)
  })
});