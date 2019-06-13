require('dotenv').config();

const { Map, List } = require('immutable')

const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');

const fs = require('fs');
const fse = require('fs-extra');

const USERDATA_FILE_PATH = './user_list.json';

/**
 * 
 * @param Object { user_id, status, comment, back_time }
 * @return Promise
 */
exports.attend = (async({ user_id, status, comment, back_time }) => {

    //! try-catch statement
    const userSrc = await fse.readJson(USERDATA_FILE_PATH);
    const userData = new List(userSrc);
    let userObj = userData.find( (v, k) => v.adid === user_id );
    if ( !userObj ) return false;
    console.log(userObj);

    const browser = await puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
        ]
    });
    const page = await browser.newPage();
    //const iPhone = devices['iPhone 6'];
    //await page.emulate(...)

    const URL = process.env.EXB_URL;
    const EXB_LOGIN_ID = process.env.EXB_LOGIN_ID;
    const EXB_LOGIN_PASS = process.env.EXB_LOGIN_PASS;
    

    await page.goto(URL);
    await page.type('#UserCd', EXB_LOGIN_ID);
    await page.type('#UserPassword', EXB_LOGIN_PASS);
    await page.click('#div1 > table > tbody > tr:nth-child(3) > td.w20.l > input');

    await page.goto(URL + '/whiteboard/edit/' + String(userObj.id), { waitUntil: "domcontentloaded" });


    //-- 他人の入力云々の警告避け
    var nel = `body > div.ui-dialog.ui-widget.ui-widget-content.ui-corner-all.error-message.ui-draggable.ui-resizable > div.ui-dialog-buttonpane.ui-widget-content.ui-helper-clearfix > button`;
    var notice = await page.$(nel);
    if ( notice !== null ) await page.click(nel);

   
    switch ( status ) {
        case 'attend': // 出席
            await page.click('#WhiteboardSite1');
            break;
        case 'out': // 外出
            await page.click('#WhiteboardSite2');
            break;
        case 'leave': // 離席
            await page.click('#WhiteboardSite3');
            break;
        case 'home': // 帰宅
            await page.click('#WhiteboardSite4');
            break;
        case 'trip': // 出張
            await page.click('#WhiteboardSite5');
            break;
        case 'meeting': // 会議
            await page.click('#WhiteboardSite5');
            break;
        case 'noreturn': // 直帰
            await page.click('#WhiteboardSite5');
            break;
        default:
            throw new Exception(`想定外の状態 ${String(status)} を受け取りました。`);
    }

    await page.type('#WhiteboardMemo', comment);
    await page.type('#WhiteboardBacktime', back_time);

    await page.click('#btn_submit');

    /*
    await page.goto(URL + '/whiteboard/index', { waitUntil: "domcontentloaded" });
    //let selector = (await page.$x('//*[@id="division_id"]'))[0];
    console.log("wait...")
    await page.waitForSelector('select#division_id');
    //let selector = (await page.$x('//*[@id="division_id"]'))[0];

    //await page.select('select#division_id', '0');
    await page.evaluate( () => {
        //$("select#division_id").val(0).change();
        //document.getElementById('division_id').value('0');
        var obj = document.getElementById('division_id');
        obj.selectedIndex = 17;

        // セルフイベント発火
        //var evt = document.createEvent('HTMLEvents');
        var evt = new Event('change');
        //evt.initEvent('change', true, false);
        obj.dispatchEvent(evt);
    }); 
    await page.waitFor(1000);
    //var target = (await page.$(`a[href*="${user}"]`).parent('td').$(':nth-child(3)'));
    await page.evaluate( () => {
        var target = $(`a[href*="kawasaki"]`).parent('td').$(':nth-child(3)');
        target.click();
    });
    await page.waitFor(1000);
    
    //await target.$(':root:nth-child(3)').click();
    //await selector.select('0');
    //await page.select('select[name="data[User][division_id]"]', '(全員)');
    //await page.select('select[name="data[User][division_id]"]', '0');
    //await page.select('select#division_id', '0');
    */
    await page.screenshot({ path: './test.png', fullPage: true });
})




/**
 * 
 * @param Object { user_id, status, comment, back_time }
 * @return Promise
 */
exports.refreshIdList = (async({ user_id, status, comment, back_time }) => {
    const browser = await puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
        ]
    });
    const page = await browser.newPage();

    const URL = process.env.EXB_URL;
    const EXB_LOGIN_ID = process.env.EXB_LOGIN_ID;
    const EXB_LOGIN_PASS = process.env.EXB_LOGIN_PASS;

    await page.goto(URL);
    await page.type('#UserCd', EXB_LOGIN_ID);
    await page.type('#UserPassword', EXB_LOGIN_PASS);
    await page.click('#div1 > table > tbody > tr:nth-child(3) > td.w20.l > input');

    //await page.click('#whiteboard > thead > tr > th.w8.r > a');
    //<a href="/rcs/whiteboard/edit/83" class="icn"><span class="icn_pencil">&nbsp;</span>入力</a>
    let attendLink = 'a[href^="/rcs/whiteboard/edit"]';
    await page.waitForSelector(attendLink);


    //-- 全員の所在ページへ移動
    await page.goto(URL + '/whiteboard/index', { waitUntil: "domcontentloaded" });
    //console.log("wait...")
    await page.waitForSelector('select#division_id');

    await page.evaluate( () => {
        var obj = document.getElementById('division_id');
        obj.selectedIndex = 17;
        var evt = new Event('change');
        obj.dispatchEvent(evt);
    }); 
    await page.waitFor(1000);

    // '#whiteboard_search > table > tbody > tr:nth-child(1)'
    let tr = '#whiteboard_search > table > tbody > tr'


    let userRecords = await page.$$(tr);
    //console.log(userRecords.length);

    let editEl; let mailEl;
    let id; let mail; let name;
    let userData = [];
    for (let e of userRecords) {
        
        // exboard 上の id 
        editEl = await e.$('td > a[href^="/rcs/whiteboard/edit"]');
        id = await ( await editEl.getProperty('href') ).jsonValue();
        id = id.split('/');
        // 氏名
        name = await e.$eval('td:nth-child(2)', el => el.innerText );
        // メール（登録していない人は取得できないので '???'）
        mailEl = await e.$('td > a[href^="mailto"]');
        mail = ( mailEl ) ? await ( await mailEl.getProperty('href') ).jsonValue() : "???";
        mail = mail.replace(/mailto:/g, "");

        // ユーザ情報のレコード生成
        userData.push({
            //id: id.replace(/http:\/\/rcsboard.net\/rcs\/whiteboard\/edit\//g, ""),
            id: Number(id.pop()),
            name : name.replace(/[ |☆]/g, ""),
            mail,
            adid: mail.replace(/@c-rcs.jp/g, ""),
        });
    }
    console.log(userData);
    fs.writeFile(USERDATA_FILE_PATH, JSON.stringify(userData, null, '    '));
    await page.screenshot({ path: './list.png', fullPage: true });
})


    /*
    await page.click(attendLink);
    let optionList = await page.$$('#WhiteboardUserId2 > option');
    let values = [];
    let tmp = "";
    // async/await の都合、無名関数ブロックで閉じる map が使いづらいので for of イテレータを使う
    for (let opt of optionList ) {
        //tmp = await ( await opt.getProperty('value')).jsonValue();
        tmp = await opt.$eval('*', e => e.innerText );
        values.push(tmp);
    }
    console.log(values);
    */