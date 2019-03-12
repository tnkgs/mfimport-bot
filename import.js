require('dotenv').config();
const fs = require('fs');
const path = require('path');
const parse = require('csv').parse;
const iconv = require('iconv-lite');
const { Builder, By, until, Key } = require('selenium-webdriver');
const actions = require('selenium-webdriver/lib/actions');
const LegacyActionSequence = actions.LegacyActionSequence;
const accounts = require('./accounts');
const subjects = require('./subjects');

async function importData(datas) {
  const driver = new Builder().forBrowser('chrome').build();
  await driver.get('https://moneyforward.com/cf');
  console.log('open https://moneyforward.com/cf');
  const emailInput = await driver.findElement(By.id('sign_in_session_service_email'));
  await emailInput.sendKeys(process.env.email);
  const passInput = await driver.findElement(By.id('sign_in_session_service_password'));
  await passInput.sendKeys(process.env.password);
  const loginButton = await driver.findElement(By.id('login-btn-sumit'));
  await loginButton.submit();
  const buttons = await driver.wait(until.elementsLocated(By.className('cf-new-btn')));
  await buttons[1].click();
  console.log('click cf-new-btn');
  for (let data of datas) {
    const { date, amount, account, lc, mc, content } = data;
    console.log(data);
    await driver.wait(until.elementLocated(By.id('form-user-asset-act')));
    await driver.sleep(500);
    const dateInput = await driver.findElement(By.id('updated-at'));
    await dateInput.clear();
    await dateInput.sendKeys(date);
    await dateInput.click();
    await dateInput.click();
    await driver.sleep(30);
    const accountOption = await driver.findElement(By.xpath(`//*[@id="user_asset_act_sub_account_id_hash"]/option[@value="${accounts[account]}"]`));
    await accountOption.click();
    await driver.sleep(30);
    const amountInput = await driver.findElement(By.id('appendedPrependedInput'));
    await amountInput.sendKeys(amount);
    await driver.sleep(30);
    const lcS = await driver.findElement(By.id('js-large-category-selected'));
    await lcS.click();
    await driver.sleep(30);
    const lcA = await driver.findElement(By.xpath(`//a[@class="l_c_name" and @id="${subjects[lc].id}"]`));
    await driver.wait(until.elementIsVisible(lcA));
    await driver.sleep(300);
    await new LegacyActionSequence(driver).mouseMove(lcA).perform();
    await driver.sleep(30);
    const mcA = await driver.findElement(By.xpath(`//a[@class="m_c_name" and @id="${subjects[lc].childs[mc]}"]`));
    await driver.wait(until.elementIsVisible(mcA));
    await mcA.click();
    await driver.sleep(30);
    const contentInput = await driver.findElement(By.id('js-content-field'));
    await contentInput.sendKeys(content);
    await driver.sleep(30);
    const submitButton = await driver.findElement(By.id('submit-button'));
    await submitButton.submit();
    console.log('inserted');
    await driver.sleep(500);
    const confirmButton = await driver.wait(until.elementLocated(By.id('confirmation-button')));
    await driver.wait(until.elementIsVisible(confirmButton));
    await confirmButton.click();
    await driver.sleep(30);
  }
  await driver.quit();
}

const parser = parse({ columns: true });
const rs = fs.createReadStream(path.resolve(__dirname, 'import.csv'))
  .pipe(iconv.decodeStream('SJIS'))
  .pipe(iconv.encodeStream('UTF-8'))
  .pipe(parser);

let datas = [];

parser.on('readable', () => {
  let data;
  while (data = parser.read()) {
    datas.push(data);
  }
});

parser.on('end', () => {
  importData(datas);
});
