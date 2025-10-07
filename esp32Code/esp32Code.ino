#include <Keypad.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Arduino.h>
#include <LiquidCrystal_I2C.h>

int lcdColumns = 16;
int lcdRows = 2;

LiquidCrystal_I2C lcd(0x27, lcdColumns, lcdRows);  

#define SS_PIN 13
#define RST_PIN 17
#define MOSI_PIN 15
#define MISO_PIN 16
#define SCK_PIN 14

MFRC522 rfid(SS_PIN, RST_PIN);

struct map{
  String key;
  String value;
};

struct map pairs[] = {
    {" 43 0A F5 E3", "coffee powder"},
    {" 13 EE 9E FB", "snickers"},
    {" 03 3C 8A FB", "Lays"},
    {" D3 C3 84 FB", "Batter"},
    {" C7 A0 22 65", "Coke"}
};


HTTPClient http;

using namespace std;

#define ROW_NUM     4 // four rows
#define COLUMN_NUM  4 // four columns

char keys[ROW_NUM][COLUMN_NUM] = {
  {'1', '2', '3', 'A'},
  {'4', '5', '6', 'B'},
  {'7', '8', '9', 'C'},
  {'*', '0', '#', 'D'}
};

uint8_t pin_rows[ROW_NUM]      = {33, 32, 27, 26}; // GPIO19, GPIO18, GPIO5, GPIO17 connect to the row pins
uint8_t pin_column[COLUMN_NUM] = {25, 23, 19, 18};   // GPIO16, GPIO4, GPIO0, GPIO2 connect to the column pins

Keypad keypad = Keypad(makeKeymap(keys), pin_rows, pin_column, ROW_NUM, COLUMN_NUM);

const char* ssid = ""; //WIFI-Name
const char* password = "";//WIFI-Password

const String serverName = "http://192.168.0.102:3000/api/"; //repalce with local ip of laptop 

void setup() {
  Serial.begin(115200);

  pinMode(14,OUTPUT);

  lcd.init();
  lcd.backlight();
  lcd.setCursor(0,0);


  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    lcd.print("Connecting WiFi...");
  }

  lcd.print("Connected");
  delay(2000);
}

String find(String s){
  for(int i=0; i<5; i++){
    if(pairs[i].key==s){
      return pairs[i].value;
    }
  }
  return "";
}

int checkout(String number, String pass){
  String authAPI = serverName+"checkout";

  http.begin(authAPI);
  http.addHeader("Content-Type", "application/json");

  String jsonData = "{\"number\": \""+number+"\", \"password\": "+pass+"}";

  int httpResponseCode = http.POST(jsonData);
  Serial.println(httpResponseCode);
  http.end();
  lcd.clear();
  lcd.setCursor(0,0);
  if(httpResponseCode<=0){
    lcd.print("Error in sending post");
    delay(2000);
    lcd.setCursor(0,1);
    lcd.print(httpResponseCode);
    return 0;
  }
  if(httpResponseCode==200){
    return 1;
  } else if(httpResponseCode==402){
      return 2;
  }
  return 0;
}

int scan(String number, String pass){
  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("Scan items!");
  lcd.setCursor(0,1);
  lcd.println("A-Menu D-checkout");

  while(true){
    char key = keypad.getKey();
    if(key){
      if(key=='A'){
        return 1;
      }
      if(key=='D'){
        lcd.clear();
        lcd.setCursor(0,0);
        lcd.print("Checking out...");
        unsigned long startTime = millis();
        int cStatus=0;
        while(cStatus!=2 && cStatus!=1 && millis()-startTime < 10000){
          cStatus = checkout(number, pass);
        }
        if(cStatus==2){
          return 0;
        }
        if(cStatus==1){
          return 0;
        }
        else{
          lcd.clear();
          lcd.setCursor(0,0);
          lcd.print("Error during checkout");
          return 1;
        }
      }
    }

    if (!rfid.PICC_IsNewCardPresent()) {
      continue;
    }

    // Select one of the cards
    if (!rfid.PICC_ReadCardSerial()) {
      continue;
    }

    Serial.println("Card detected!");

    // Print the UID of the card
    String content = "";
    for (uint8_t i = 0; i < rfid.uid.size; i++) {
      content.concat(String(rfid.uid.uidByte[i] < 0x10 ? " 0" : " "));
      content.concat(String(rfid.uid.uidByte[i], HEX));
    }
    content.toUpperCase();
    String s = find(content);
    lcd.clear();
    lcd.setCursor(0,0);
    if(s==""){
      lcd.print("Unknown Item");
    }
    else{
      lcd.print("Adding...");
      unsigned long startTime = millis();
      int addStatus=0;
      while(addStatus!=1 && millis()-startTime < 10000){
        addStatus = addItem(number, pass, s, 1);
      }
      if(addStatus==1){
        lcd.clear();
        lcd.print(s + " Added!");
      }
      else{
        lcd.clear();
        lcd.print("please scan again");
      }
      delay(3000);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("Scan items!");
      lcd.setCursor(0,1);
      lcd.println("A-Menu D-checkout");
    }
  }
}


String getNumber(int mode) {
  int pos=0;
  String s = "";
  char key;

  while (true) {
    key = keypad.getKey();

    if (!key) {
      continue;
    } else if (key == '*') {
      lcd.setCursor(0,0);
      lcd.clear();
      break;
    } else {
      s += key;
      lcd.setCursor(pos,1);
      pos++;
      if(mode)
        lcd.print('*');
      else
        lcd.print(key);
    }
  }

  return s;
}


int authenticate(String number, String pass){

  String authAPI = serverName+"authorize";

  http.begin(authAPI);
  http.addHeader("Content-Type", "application/json");

  String jsonData = "{\"number\": \""+number+"\", \"password\": "+pass+"}";

  int httpResponseCode = http.POST(jsonData);
  http.end();
  if(httpResponseCode<=0){
    return 2;
  }
  if(httpResponseCode==200){
    return 1;
  } else if(httpResponseCode==402){
      return 3;
  }
  return 0;
  
}


int addItem(String number, String pass, String itemName, int quantity){

  String authAPI = serverName+"additem";

  http.begin(authAPI);
  http.addHeader("Content-Type", "application/json");

  String jsonData = "{\"number\": \""+number+"\", \"password\": "+pass+", \"itemName\": \""+itemName+"\", \"quantity\": "+quantity+"}";

  int httpResponseCode = http.POST(jsonData);
  http.end();
  if(httpResponseCode<=0){
    return 2;
  }
  if(httpResponseCode==200){
    return 1;
  }
  if(httpResponseCode==402){
      return 3;
  }
  return 0;
  
}

int deleteItem(String number, String pass, String itemName){

  String authAPI = serverName+"deleteItem";

  http.begin(authAPI);
  http.addHeader("Content-Type", "application/json");

  String jsonData = "{\"number\": \""+number+"\", \"password\": "+pass+", \"itemName\": \""+itemName+"\"}";

  int httpResponseCode = http.POST(jsonData);
  http.end();
  if(httpResponseCode<=0){
    return 2;
  }
  if(httpResponseCode==200){
    return 1;
  }
  if(httpResponseCode==402){
      return 3;
  }
  return 0;
  
}


int getItems(String number, String pass){
  String authAPI = serverName+"getItems";

  http.begin(authAPI);
  http.addHeader("Content-Type", "application/json");

  String jsonData = "{\"number\": \""+number+"\", \"password\": "+pass+"}";

  lcd.clear();
  lcd.setCursor(0,0);

  lcd.print("Fetching Kart...");
  int httpResponseCode = http.POST(jsonData);
  http.end();
  if(httpResponseCode<=0){
    return 2;
  }
  if(httpResponseCode==200){
    lcd.clear();
    lcd.setCursor(0,0);
    String payload = http.getString();
    lcd.print("Your Kart:");
    lcd.setCursor(0,1);
    lcd.print("< A     D >");
    delay(3000);
    DynamicJsonDocument responseDoc(1024);
    DeserializationError error = deserializeJson(responseDoc, payload);
    if (error) {
      Serial.println("Failed to parse JSON");
      return 0;
    }

    struct map kart[100];
    int ptr=0;

    for (JsonPair kv : responseDoc.as<JsonObject>()) {
      kart[ptr].key = kv.key().c_str();
      kart[ptr].value = kv.value().as<String>();
      ptr++;
    }
    int max = ptr-1;
    ptr=0;
    lcd.setCursor(0,0);
    lcd.print("                ");
    lcd.setCursor(0,0);
    lcd.print(kart[ptr].key+":"+kart[ptr].value);

    char key;
    while (true) {
      key = keypad.getKey();

      if (!key) {
        continue;
      }
      if(key=='A' && ptr!=0){
        ptr--;
        lcd.setCursor(0,0);
        lcd.print("                ");
        lcd.setCursor(0,0);
        lcd.print(kart[ptr].key+":"+kart[ptr].value);
      }
      if(key=='D' && ptr!=max){
        ptr++;
        lcd.setCursor(0,0);
        lcd.print("                ");
        lcd.setCursor(0,0);
        lcd.print(kart[ptr].key+":"+kart[ptr].value);
      }
      if(key=='B'){
        lcd.clear();
        lcd.print("deleting...");
        deleteItem(number,pass,kart[ptr].key);
        lcd.clear();
        lcd.print("item removed");
        delay(2000);
        break;
      }
      if(key=='C')
        break;
    }
    return 1;
  } else if(httpResponseCode==402){
      Serial.println("Invalid Authentication");
      return 3;
  }
  lcd.clear();
  lcd.print("Unexpected Error");
  return 0;
  
}

int getBalance(String number, String pass){
  String authAPI = serverName+"getBalance";

  http.begin(authAPI);
  http.addHeader("Content-Type", "application/json");

  String jsonData = "{\"number\": \""+number+"\", \"password\": "+pass+"}";

  lcd.clear();
  lcd.setCursor(0,0);

  lcd.print("Fetching Balance...");
  int httpResponseCode = http.POST(jsonData);
  http.end();
  if(httpResponseCode<=0){
    return 2;
  }
  if(httpResponseCode==200){

    lcd.clear();
    String payload = http.getString();
    lcd.print("Balance: "+payload);
    delay(2000);
    return 1;
    
  } else if(httpResponseCode==402){
      Serial.println("Invalid Authentication");
      return 3;
  }
  lcd.clear();
  lcd.print("Unexpected Error");
  return 0;
  
}


void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    int auth = 0;
    String number,password;
    
    while(!auth){
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("Phone Number: ");
      number = getNumber(0);
      lcd.print("Enter password: ");
      password = getNumber(1);
      auth = authenticate(number,password);
      if(auth==0){
        lcd.print("Invalid email or password");
      }
      else if(auth==2){
        lcd.print("unexpected error");
        auth=0;
      }
      else if(auth==3){
        lcd.print("Unregistered User");
        auth=0;
      }
      else{
        lcd.print("Logged In!");
      }
      delay(3000);
      lcd.clear();
    }
    SPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN, SS_PIN);
    rfid.PCD_Init();
    int scanStatus = scan(number,password);
    while(scanStatus){
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("A-Kart B-Balance");
      lcd.setCursor(0,1);
      lcd.print("   C->Resume");

      char key;
      while(true){
        key = keypad.getKey();
        if(!key)
          continue;
        if(key=='A' || key=='B' || key=='C')
          break;
      }
      if(key=='A'){
        unsigned long startTime = millis();
        int getStatus=0;
        while(getStatus!=1 && millis()-startTime < 10000){
          getStatus = getItems(number, password);
        }
        if(getStatus!=1){
          lcd.print("Some Unexpected error has occured");
        }
        
        lcd.clear();
        lcd.setCursor(0,0);
        lcd.print("press C to resume");
        while(!key || key!='C'){
          key = keypad.getKey();
        }
      }

      if(key=='B'){
        unsigned long startTime = millis();
        int getStatus=0;
        while(getStatus!=1 && millis()-startTime < 10000){
          getStatus = getBalance(number, password);
        }
        if(getStatus!=1){
          lcd.print("Some Unexpected error has occured");
          delay(2000);
        }
        lcd.setCursor(0,1);
        lcd.print("press C to resume");
        while(!key || key!='C'){
          key = keypad.getKey();
        }
      }

      scanStatus = scan(number,password);
    }
    lcd.clear();
    lcd.setCursor(0,0);
    lcd.print("Happy Shopping!");

  } else {
    lcd.print("WiFi Disconnected");
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  delay(10000); 
}