# 🌐 PocketBase Developer Cheat Sheet

## 📌 Useful Links
- 🌍 [Official Website](https://pocketbase.io/)
- 🐙 [GitHub Repository](https://github.com/pocketbase/pocketbase)

---

## 🔄 Common CRUD Operations

```js
// JavaScript SDK
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

// 🔍 List records
const list = await pb.collection('example').getList(1, 100, {
    filter: 'title != "" && created > "2022-08-01"',
    sort: '-created,title',
});

// 📄 Get one record
const record = await pb.collection('example').getOne('RECORD_ID');

// ❌ Delete a record
await pb.collection('example').delete('RECORD_ID');

// 🆕 Create a new record
const newRecord = await pb.collection('example').create({
    title: 'Lorem ipsum dolor sit amet',
});

// 🔔 Subscribe to changes
pb.collection('example').subscribe('*', function (e) {
    console.log(e.record);
});

// 📴 Unsubscribe from changes
pb.collection('example').unsubscribe();



🔐 Common Authentication Operations
// JavaScript SDK
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

// 📝 Sign up a new user
await pb.collection('users').create({
    email:           'test@example.com',
    password:        '123456',
    passwordConfirm: '123456',
    name:            'John Doe',
});

// 🔑 Sign in with email and password
await pb.collection('users').authWithPassword('test@example.com', '123456');

// 🌐 OAuth2 login (Google, etc.)
await pb.collection('users').authWithOAuth2({
    provider: 'google',
});

// 📧 Send verification email
await pb.collection('users').requestVerification('test@example.com');

// 🔁 Request password reset
await pb.collection('users').requestPasswordReset('test@example.com');

// 📬 Request email change
await pb.collection('users').requestEmailChange('new@example.com');



🗂️ File Storage Operations
// JavaScript SDK
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

// 📎 Upload multiple files to a new record
const record = await pb.collection('example').create({
    title: 'Hello world!',
    yourFileField: [
        new File(['example content 1...'], 'file1.txt'),
        new File(['example content 2...'], 'file2.txt'),
    ]
});

// 🗑️ Delete all files from a record
await pb.collection('example').update(record.id, {
    yourFileField: null,
});



🧩 Extensions & Custom Logic
// pb_hooks/main.pb.js

// ⚠️ Intercept record update requests
onRecordUpdateRequest((e) => {
    console.log(e.record.id);
    e.next();
});

// 📬 Intercept system emails
onMailerRecordVerificationSend((e) => {
    e.mailClient.send(...); // send custom email
});

// ➕ Register custom routes
routerAdd(
    "get",
    "/hello",
    (e) => {
        return e.string(200, "Hello!");
    },
    $apis.requireSuperuserAuth()
);

// ⏰ Schedule jobs with cron
cronAdd("hello", "*/2 * * * *", () => {
    console.log("Hello!"); // runs every 2 minutes
});
