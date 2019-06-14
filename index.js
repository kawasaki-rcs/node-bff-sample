require('dotenv').config();


var bodyParser = require('body-parser');


app = require('express')();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(require('cors')());

app.post('/api/authenticate', function (req, res) {
    console.log(req.body.payload);
    var username = req.body.payload.username;
    var password = req.body.payload.password;

    // username: "guest", password: "guest" なら問答無用で成功にする
    if(username && password) {
        if ( username === "guest" && password === "guest" ) {
            res.json({ payload: { token: "dummy_token", username } });
        } else {
            res.status(401).send({ error: 'ユーザ名とパスワードを確認して下さい。'});
        }
    } else {
        res.status(401).send({error: 'ユーザ名かパスワードが与えられていません。'});
    }
});


// 無条件でトークン認証を通す
function checkToken (req, res) {
    //var bearerToken = req.headers.authorization;
    //if (bearerToken) { }
    return true;
}

// 出席の受付
app.post('/api/attend', function (req, res) {
    console.log(req.body.payload);
    var decoded = checkToken(req, res);
    if ( decoded ) {
        // 受け取ったデータで出席処理
        //var payload = req.body.payload;
        //attend(payload); 
    }
    res.json({ payload: { status: "success" } });
});


var port = (process.env.PORT || 3010);

app.listen(port, function() {
    console.log('Listening on port: ' + port);
});
