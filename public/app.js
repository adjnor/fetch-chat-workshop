const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const usernameInput = document.getElementById('login-username');
const passwordInput = document.getElementById('login-password');
const signupUsernameInput = document.getElementById('signup-username');
const signupPasswordInput = document.getElementById('signup-password');

const chatHTML = `
  <h3>Messages</h3>
  <ul id="msg-list"></ul>
  <h3>Active users</h3>
  <ul id="active-user-list"></ul>
  <h3>Direct messages</h3>
  <ul id="direct-messages-list"></ul>
  <form id="message-form">
    <label for="message-input">Message</label>
    <input type="text" name="message" id="message-input"></input>
    <input type="submit"></input>
  </form>
  <h1>Ignore user</h1>
  <form id="ignore-form">
    <label for="ignore-username">Ignore</label>
    <input type="text" name="username" id="ignore-username"></input>
    <input type="submit"></input>
  </form>
  <h1>Send direct message</h1>
  <form id="direct-message-form">
    <label for="recipient">Recipient</label>
    <input type="text" name="recipient" id="recipient"></input>
    <label for="message-content">Message</label>
    <input type="text" name="message" id="message-content"></input>
    <input type="submit"></input>
  </form>
`;

// Setup form event listeners

function setupFormListener(form, dataElements, endpoint, callback) {
  form.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    const formData = new FormData();
    dataElements.forEach((elem) => formData.append(elem.name, elem.value));
    dataElements.forEach((elem) => (elem.value = '')); // clear the form elements after having added their values to formData
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });
    const body = await response.json();
    if (!body.success) alert(body.msg);
    else if (callback) callback();
  });
}

function setupMessageFormListener() {
  const messageForm = document.getElementById('message-form');
  const messageInput = document.getElementById('message-input');
  setupFormListener(messageForm, [messageInput], '/messages');
}

function setupDirectMessagesFormListener() {
  const directMessageForm = document.getElementById('direct-message-form');
  const recipient = document.getElementById('recipient');
  const messageContent = document.getElementById('message-content');
  setupFormListener(
    directMessageForm,
    [recipient, messageContent],
    '/direct-message'
  );
}

function setupIgnoreFormListener() {
  const ignoreForm = document.getElementById('ignore-form');
  const usernameInput = document.getElementById('ignore-username');
  setupFormListener(ignoreForm, [usernameInput], '/ignore');
}

function renderChat() {
  document.body.innerHTML = chatHTML;

  setupMessageFormListener();
  setupDirectMessagesFormListener();
  setupIgnoreFormListener();

  // trigger update logic
  fetchAndUpdate();
  setInterval(fetchAndUpdate, 500);
}

// setup authentication forms

setupFormListener(
  loginForm,
  [usernameInput, passwordInput],
  '/login',
  renderChat
);

setupFormListener(
  signupForm,
  [signupUsernameInput, signupPasswordInput],
  '/signup',
  () => alert('Success!')
);

// Update logic

function createList(id, elements) {
  const list = document.getElementById(id);
  list.innerHTML = '';
  elements.forEach((elem) => {
    const li = document.createElement('li');
    li.innerText = elem;
    list.append(li);
  });
}

const fetchAndUpdate = () => {
  fetch('/messages')
    .then((response) => response.text())
    .then((responseBody) => {
      const parsed = JSON.parse(responseBody);
      if (!parsed.success) return;
      createList(
        'msg-list',
        parsed.messages.map((msgObj) => `${msgObj.user} : ${msgObj.msg}`)
      );
      createList(
        'active-user-list',
        parsed.messages
          .filter((msgObj) => Date.now() - msgObj.timestamp <= 8000)
          .map((msgObj) => msgObj.user)
      );
    });

  fetch('/direct-messages')
    .then((response) => response.json()) // using .json() is equivalent to .text() then JSON.parse()
    .then((responseBody) => {
      if (!responseBody.success) return;
      createList(
        'direct-messages-list',
        responseBody.messages.map((msgObj) => `${msgObj.user} : ${msgObj.msg}`)
      );
    });
};
