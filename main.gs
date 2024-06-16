
// OpenWeatherAPIキーを[プロジェクトの設定]の「スクリプト プロパティを追加」より"OPENWEATHER_API_KEY"と取得したAPIキーをを追加します。
const API_KEY = PropertiesService.getScriptProperties().getProperty("OPENWEATHER_API_KEY");
const CITY = 'Tokyo';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/forecast';


var cc = DataStudioApp.createCommunityConnector();

// 必須Function：指定されたリクエストのスキーマを返す
function getSchema(request) {
  var fields = getFields(request).build();
  return { schema: fields };
}

// 必須Function：コネクタのユーザー設定可能なオプションを返す
function getConfig(request) {
    const config = cc.getConfig();

    config.newInfo()
        .setId('instructions')
        .setText('Enter City Name.');

    config.newTextInput()
        .setId('city')
        .setName('City')
        .setHelpText('Enter the city you want to get the weather.')
        .setPlaceholder('Tokyo')
        .setAllowOverride(true);

    return config.build();
}

// 必須Function：指定されたリクエストの表形式のデータを返す
function getData(request) {
    // const dataSchema = request.fields.filter(field => schema.some(element => element.name === field.name));

    var requestedFieldIds = request.fields.map(function(field) {
      return field.name;
    });
    var requestedFields = getFields().forIds(requestedFieldIds);

    const cityParam = request.configParams.city;
    const url = BASE_URL + (cityParam ? `?q=${encodeURIComponent(cityParam)}` : '') + `&appid=${API_KEY}&units=metric&lang=ja`;

    console.log(url);
    
    const response = UrlFetchApp.fetch(url);
    var responseCode = response.getResponseCode();
    var responseBody = response.getContentText();
    console.log(responseBody);
    const parsedResponse = JSON.parse(responseBody);


    const rows = responseToRows(requestedFields, parsedResponse);
    console.log(rows);

    return {
        schema: requestedFields.build(),
        rows: rows
    };
}

// 必須Function：コネクタの認証方法を返す
function getAuthType() {
    return { type: 'NONE' };  // No authentication required
}


// getSchema()サポート用
function getFields(request) {
  var fields =cc.getFields();
  var types = cc.FieldType;

  // データの時刻
  fields.newDimension()
    .setId('date')
    .setName('DATE')
    .setType(types.YEAR_MONTH_DAY_SECOND);
  // 気象状態
  fields.newDimension()
    .setId('weather')
    .setName('Weather')
    .setType(types.TEXT);
  fields.newDimension()
    .setId('icon')
    .setName('Icon')
    .setType(types.URL);
  // 気温
  fields.newDimension()
    .setId('temp')
    .setName('Temp')
    .setType(types.NUMBER);
  // 気象状態
  fields.newDimension()
    .setId('humidity')
    .setName('Humidity')
    .setType(types.NUMBER);

  return fields;
}


// APIレスポンスのフィールドを取得し、Looker Studio用に定義された行を返す。
function responseToRows(requestedFields, response) {
  const data = response.list;
  return data.map(function(forecast) {
    var row = [];
    requestedFields.asArray().forEach(function (field) {
      switch (field.getId()) {
        case 'date':
          var date = new Date(Number(forecast.dt)*1000)
          return row.push(Utilities.formatDate(date, 'Asia/Tokyo', 'yyyyMMddHHmmss'));
        case 'weather':
          return row.push(forecast.weather[0].description);
        case 'icon':
          return row.push(`https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png`);          
        case 'temp':
          return row.push(Number(forecast.main.temp));
        case 'humidity':
          return row.push(Number(forecast.main.humidity));
        default:
          return row.push('');
      }
    });
    return { values: row };
  });
}

// 現在のユーザーに管理者権限があるかどうかを確認する
function isAdminUser() {
    // すべてのユーザーが管理者ユーザーとして扱う
    return true;
}

// テスト用
function testGetData() {
  var request = {
    configParams: {
      "city": "Tokyo"
    },
    fields: [
      { name: "date" },
      { name: "weather" },
      { name: "icon" },
      { name: "temp" },
      { name: "humidity" }
    ]
  };

  var response = getData(request);
  Logger.log(JSON.stringify(response));
}