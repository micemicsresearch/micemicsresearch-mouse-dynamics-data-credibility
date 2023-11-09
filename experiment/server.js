const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser')
const app = express()
const WebSocket = require('ws')

const databaseManagerModule = require('./database/DBmanager.js')
const dbManager = new databaseManagerModule.databaseManager()

const twoWeeksInMiliseconds = 1209600000

app.use(bodyParser.json()) 
app.use(bodyParser.urlencoded({
  extended: true
}))

app.use(session({
    secret: 'experiment-secret',
    resave: false,
    saveUninitialized: true,
    secure: false,
    cookie: {
        httpOnly: false,
        secret: false,
        maxAge: twoWeeksInMiliseconds
    }
}))

///////////////////\\\\\\\\\\\\\\\\\\\
/*              sockets             */
/************************************/

//minigame socket
const minigameWss = new WebSocket.Server({ port: 8082 })
minigameWss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        const incomingData = JSON.parse(message)

        if (incomingData.type === 'mousePosition') {
            dbManager.insertMinigameEvents(incomingData.data)
        } else if (incomingData.type === 'pointPosition') {
            dbManager.insertMinigameTargets(incomingData.data)
        }
    })
})

//points socket
const pointsWss = new WebSocket.Server({ port: 8083 })
pointsWss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        const incomingData = JSON.parse(message)

        if (incomingData.type === 'mousePosition') {
            dbManager.insertPointClickingEvents(incomingData.data)
        } else if (incomingData.type === 'pointPosition') {
            dbManager.insertPointClickingTargets(incomingData.data)
        }
    })
})

//prototype socket
const prototypeWss = new WebSocket.Server({ port: 8084 })
prototypeWss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        const incomingData = JSON.parse(message)

        if (incomingData.type === 'mousePosition') {
            dbManager.insertPrototypeEvents(incomingData.data)
        }
    })
})

//server config
app.use(express.static('html'))
app.use(express.static('styles'))
app.use(express.static('scripts'))
app.use(express.static('images'))

///////////////////\\\\\\\\\\\\\\\\\\\
/*         server endpoints         */
/************************************/

app.get('/products_list', (req, res) => {
    if (req.query.prototypeVariant === 'A') {
        res.json({
            "firstProducts": [ 
                { "name": "ASUS Zenbook 14", "image": "1A/asus_zenbook_14.png", "price": 528.9, "final": false },
                { "name": "Samsung Galaxy S22", "image": "1A/samsung_galaxy_s22.png", "price": 259.9, "final": false },
                { "name": "Honor X6", "image": "1A/samsung_galaxy_s22.png", "price": 280.5, "final": false },
                { "name": "LG 55UP8100", "image": "1A/LG_55UP8100.jpg", "price": 861.9, "final": false },
                { "name": "Lenovo Legion 5", "image": "1A/asus_zenbook_14.png", "price": 612.45, "final": false },
                { "name": "Samsung QE55Q60B", "image": "1A/LG_55UP8100.jpg", "price": 763.9, "final": false },
            ],
            "secondProducts": [ 
                { "name": "Xiaomi Redmi 11", "image": "1A/XIAOMI_redmi_note_11.jpg", "price": 345.9, "final": false },
                { "name": "iPhone 12", "image": "1A/iPhone_12.png", "price": 674.9, "final": false },
                { "name": "Honor X7", "image": "1A/honor_x7.jpg", "price": 179.8, "final": false },
                { "name": "Honor X8", "image": "1A/honor_x7.jpg", "price": 220.6, "final": false },
                { "name": "Xiaomi Redmi 10", "image": "1A/XIAOMI_redmi_note_11.jpg", "price": 312.5, "final": false },
                { "name": "iPhone 13", "image": "1A/iPhone_12.png", "price": 854.2, "final": false },
            ],
            "thirdProducts": [ 
                { "name": "Samsung Z Fold 3", "image": "1A/samsung_galaxy_zfold3.jpg", "price": 1245.9, "final": false },
                { "name": "Samsung Galaxy S22", "image": "1A/samsung_galaxy_s22.png", "price": 821.4, "final": false },
                { "name": "Samsung Galaxy M13", "image": "1A/samsung_galaxy_m13.jpg", "price": 190.2, "final": false },
                { "name": "Samsung Galaxy M23", "image": "1A/samsung_galaxy_m13.jpg", "price": 915.6, "final": false },
                { "name": "Samsung Z Fold 4", "image": "1A/samsung_galaxy_zfold3.jpg", "price": 1624.3, "final": false },
                { "name": "Samsung Galaxy S23", "image": "1A/samsung_galaxy_s22.png", "price": 263.9, "final": false },
            ],
            "fourthProducts": [ 
                { "name": "Samsung Galaxy A53", "image": "1A/Samsung_A53.jpg", "price": 385.2, "final": true },
                { "name": "Samsung Galaxy S22", "image": "1A/samsung_galaxy_s22.png", "price": 258.55, "final": false },
                { "name": "Samsung XCover Pro", "image": "1A/Samsung_galaxy_a13.jpg", "price": 356.8, "final": false },
                { "name": "Samsung Galaxy S24", "image": "1A/samsung_galaxy_s22.png", "price": 290.9, "final": false },
                { "name": "Samsung Galaxy A13", "image": "1A/Samsung_galaxy_a13.jpg", "price": 195.4, "final": false },
            ],
        })
    } else if (req.query.prototypeVariant === 'B') {
        res.json({
            "firstProducts": [ 
                { "name": "Dámske tričko biele", "image": "1B/damske_tricko_biele.jpg", "price": 7.9, "final": false },
                { "name": "Pánske nohavice", "image": "1B/panske_nohavice.jpg", "price": 24.7, "final": false },
                { "name": "Detská súprava", "image": "1B/detska_suprava.jpg", "price": 28.5, "final": false },
                { "name": "Dámsky sveter", "image": "1B/damsky_sveter.jpg", "price": 16.9, "final": false },
                { "name": "Pánske tričko sivé", "image": "1B/panske_tricko_sive.jpg", "price": 5.45, "final": false },
                { "name": "Pánske zimné topánky", "image": "1B/panske_zimne_topanky.png", "price": 34.9, "final": false },
            ],
            "secondProducts": [ 
                { "name": "Pánske nohavice", "image": "1B/panske_nohavice.jpg", "price": 24.7, "final": false },
                { "name": "Pánske tričko sivé", "image": "1B/panske_tricko_sive.jpg", "price": 5.45, "final": false },
                { "name": "Pánske zimné topánky", "image": "1B/panske_zimne_topanky.png", "price": 34.9, "final": false },
                { "name": "Pánske mikina biela", "image": "1B/panska_mikina_biela.jpg", "price": 13.6, "final": false },
                { "name": "Pánske tričko čierne", "image": "1B/panske_tricko_cierne.png", "price": 6.5, "final": false },
                { "name": "Pánske tričko červené", "image": "1B/panske_tricko_cervene.png", "price": 8.2, "final": false },
            ],
            "thirdProducts": [ 
                { "name": "Pánske tričko sivé", "image": "1B/panske_tricko_sive.jpg", "price": 5.45, "final": false },
                { "name": "Pánske mikina biela", "image": "1B/panska_mikina_biela.jpg", "price": 13.6, "final": false },
                { "name": "Pánske tričko čierne", "image": "1B/panske_tricko_cierne.png", "price": 6.5, "final": false },
                { "name": "Pánske tričko červené", "image": "1B/panske_tricko_cervene.png", "price": 8.2, "final": false },
                { "name": "Pánska mikina sivá", "image": "1B/panska_mikina_siva.jpg", "price": 16.9, "final": false },
                { "name": "Pánske tričko modré", "image": "1B/panske_tricko_modre.png", "price": 7.4, "final": false },
            ],
            "fourthProducts": [ 
                { "name": "Pánska mikina červená", "image": "1B/panska_mikina_cervena.jpg", "price": 23.2, "final": true },
                { "name": "Pánske tričko sivé", "image": "1B/panske_tricko_sive.jpg", "price": 5.45, "final": false },
                { "name": "Pánske tričko čierne", "image": "1B/panske_tricko_cierne.png", "price": 6.5, "final": false },
                { "name": "Pánske tričko červené", "image": "1B/panske_tricko_cervene.png", "price": 8.2, "final": false },
            ],
        })
    } else if (req.query.prototypeVariant === 'C') {
        res.json({
            "firstProducts": [ 
                { "name": "Bežecké topánky", "image": "1C/bezecke_topanky.jpg", "price": 25.9, "final": false },
                { "name": "Futbalová obuv žltá", "image": "1C/kopacky_zlte.jpg", "price": 34.7, "final": false },
                { "name": "Bežecké lyže", "image": "1C/bezky.jpg", "price": 48.5, "final": false },
                { "name": "Brankárske rukavice biele", "image": "1C/brankarske_rukavice_biele.jpg", "price": 28.9, "final": false },
                { "name": "Plavecké okuliare", "image": "1C/plavecke_okuliare.jpg", "price": 16.75, "final": false },
                { "name": "Basketbalová lopta", "image": "1C/basketbal_lopta.jpg", "price": 24.9, "final": false },
            ],
            "secondProducts": [ 
                { "name": "Futbalová obuv žltá", "image": "1C/kopacky_zlte.jpg", "price": 34.7, "final": false },
                { "name": "Brankárske rukavice biele", "image": "1C/brankarske_rukavice_biele.jpg", "price": 28.9, "final": false },
                { "name": "Basketbalová lopta", "image": "1C/basketbal_lopta.jpg", "price": 24.9, "final": false },
                { "name": "Volejbalová lopta", "image": "1C/volejbal_lopta.jpg", "price": 29.6, "final": false },
                { "name": "Futbalová obuv čierna", "image": "1C/kopacky_cierne.jpg", "price": 32.5, "final": false },
                { "name": "Futbalová súprava", "image": "1C/futbal_suprava_modro_cierna.jpg", "price": 41.2, "final": false },
            ],
            "thirdProducts": [ 
                { "name": "Futbalová obuv žltá", "image": "1C/kopacky_zlte.jpg", "price": 34.7, "final": false },
                { "name": "Brankárske rukavice biele", "image": "1C/brankarske_rukavice_biele.jpg", "price": 28.9, "final": false },
                { "name": "Futbalová obuv čierna", "image": "1C/kopacky_cierne.jpg", "price": 32.5, "final": false },
                { "name": "Futbalová súprava", "image": "1C/futbal_suprava_modro_cierna.jpg", "price": 41.2, "final": false },
                { "name": "Futbalová lopta červená", "image": "1C/futbal_lopta_cervena.jpg", "price": 23.9, "final": false },
                { "name": "Brankárske rukavice červené", "image": "1C/brankarske_rukavice_cervene.jpg", "price": 18.4, "final": false },
            ],
            "fourthProducts": [ 
                { "name": "Futbal lopta bielo čierna", "image": "1C/futbal_lopta_bielo_cierna.jpg", "price": 18.2, "final": true },
                { "name": "Futbalová obuv bielo žltá", "image": "1C/kopacky_bielo_zlte.jpg", "price": 35.45, "final": false },
                { "name": "Futbalová obuv žltá", "image": "1C/kopacky_zlte.jpg", "price": 34.7, "final": false },
                { "name": "Futbalová súprava", "image": "1C/futbal_suprava_modro_cierna.jpg", "price": 41.2, "final": false },
            ],
        })
    }
})

app.get('/labels', (req, res) => {
    if (req.query.prototypeVariant === 'A') {
        res.json({
            "sidebarLabelsEn": [ { "label": "Clothes", "action": false }, { "label": "Drogery", "action": false }, { "label": "Sport", "action": false }, 
                                { "label": "Garden", "action": false }, { "label": "Electronics", "action": false }, { "label": "Auto-moto", "action": false }, { "label": "Furniture", "action": false }],
            "sidebarLabelsSvk": [ { "label": "Oblečenie", "action": false }, { "label": "Drogéria", "action": false }, { "label": "Šport", "action": false }, 
                                { "label": "Záhrada", "action": false }, { "label": "Elektronika", "action": true }, { "label": "Auto-moto", "action": false }, { "label": "Nábytok", "action": false }],
            "firstUpperLabels": [ { "label": "Počítače", "action": false }, { "label": "Notebooky", "action": false }, { "label": "Mobily", "action": true }, { "label": "Príslušenstvo", "action": false }],
            "secondUpperLabels": [ { "label": "Samsung", "action": true }, { "label": "iPhone", "action": false }, { "label": "Xiaomi", "action": false }, { "label": "Honor", "action": false }],
            "instructions": [ "Prepnite si <b>jazyk</b> stránky <b>na slovenčinu</b>", 
                                "Pridajte si do košíka <b>Mobil - Samsung Galaxy A53</b><br>(tip - kategórie: elektronika <nobr>-></nobr> mobily <nobr>-></nobr> samsung)"
                            ]
        })
    } else if (req.query.prototypeVariant === 'B') {
        res.json({
            "sidebarLabelsEn": [ { "label": "Electronics", "action": false }, { "label": "Garden", "action": false }, { "label": "Sport", "action": false }, { "label": "Auto-moto", "action": false },
                                { "label": "Clothes", "action": false }, { "label": "Furniture", "action": false }, { "label": "Drogery", "action": false }],
            "sidebarLabelsSvk": [ { "label": "Elektronika", "action": false }, { "label": "Záhrada", "action": false }, { "label": "Šport", "action": false }, { "label": "Auto-moto", "action": false },
                                { "label": "Oblečenie", "action": true }, { "label": "Nábytok", "action": false }, { "label": "Drogéria", "action": false }],
            "firstUpperLabels": [ { "label": "Detské", "action": false }, { "label": "Dámske", "action": false }, { "label": "Pánske", "action": true }, { "label": "Unisex", "action": false }],
            "secondUpperLabels": [ { "label": "Tričká a mikiny", "action": true }, { "label": "Nohavice", "action": false }, { "label": "Košele", "action": false }, { "label": "Obuv", "action": false }],
            "instructions": [ "Prepnite si <b>jazyk</b> stránky <b>na slovenčinu</b>", 
                                "Pridajte si do košíka <b>pánsku mikinu červenú</b><br>(tip - kategórie: oblečenie <nobr>-></nobr> pánske <nobr>-></nobr> tričká a mikiny)"
                            ]
        })
    } else if (req.query.prototypeVariant === 'C') {
        res.json({
            "sidebarLabelsEn": [ { "label": "Clothes", "action": false }, { "label": "Furniture", "action": false }, { "label": "Drogery", "action": false },
            { "label": "Sport", "action": false }, { "label": "Garden", "action": false }, { "label": "Electronics", "action": false }, { "label": "Auto-moto", "action": false }],
            "sidebarLabelsSvk": [ { "label": "Oblečenie", "action": false }, { "label": "Nábytok", "action": false }, { "label": "Drogéria", "action": false },
                                { "label": "Šport", "action": true }, { "label": "Záhrada", "action": false }, { "label": "Elektronika", "action": false }, { "label": "Auto-moto", "action": false },
                                ],
            "firstUpperLabels": [ { "label": "Zimné športy", "action": false }, { "label": "Beh", "action": false }, { "label": "Loptové hry", "action": true }, { "label": "Vodné športy", "action": false }],
            "secondUpperLabels": [ { "label": "Futbal", "action": true }, { "label": "Basketbal", "action": false }, { "label": "Volejbal", "action": false }, { "label": "Hádzaná", "action": false }],
            "instructions": [ "Prepnite si <b>jazyk</b> stránky <b>na slovenčinu</b>", 
                                "Pridajte si do košíka <b>bielo čiernu futbalovú loptu</b><br>(tip - kategórie: šport <nobr>-></nobr> loptové hry <nobr>-></nobr> futbal)"
                            ]
        })
    }
})

app.get('/discounts_list', (req, res) => {

    if (req.query.prototypeVariant === 'A') {
        res.json({
            "firstDiscounts": [ 
                { "name": "Jazda na formule", "image": "2A/formula.jpg", "price": 150.5, "final": false },
                { "name": "Rodinný escape room", "image": "2A/escape.jpg", "price": 120.0, "final": false },
                { "name": "Paintball", "image": "2A/paintball.jpg", "price": 140.5, "final": false },
                { "name": "Zoskok z lietadla", "image": "2A/skok_padakom.jpg", "price": 240.9, "final": false },
            ],
            "secondDiscounts": [ 
                { "name": "Rodinný escape room", "image": "2A/escape.jpg", "price": 120.0, "final": false },
                { "name": "Paintball", "image": "2A/paintball.jpg", "price": 140.5, "final": false },
                { "name": "Rodinný vstup do zoo", "image": "2A/zoo.jpg", "price": 80.0, "final": false },
                { "name": "Rodinná hra bowlingu", "image": "2A/bowling.jpg", "price": 90.6, "final": false },
            ],
            "thirdDiscounts": [ 
                { "name": "Rodinný escape room", "image": "2A/escape.jpg", "price": 120.0, "final": false },
                { "name": "Rodinný vstup do zoo", "image": "2A/zoo.jpg", "price": 80.0, "final": false },
                { "name": "Jazda na rafte pre rodinu", "image": "2A/rafting.jpg", "price": 90.2, "final": false },
                { "name": "Virtuálna realita s rodinou", "image": "2A/virtualna_realita.jpg", "price": 120.9, "final": false },
            ],
            "fourthDiscounts": [ 
                { "name": "Let balónom", "image": "2A/balon.jpg", "price": 180.0, "final": true},
                { "name": "Rodinný vstup do aquaparku", "image": "2A/aquapark.jpg", "price": 120.4, "final": false },
                { "name": "Rodinný zážitkový let", "image": "2A/lietadlo.jpg", "price": 220.9, "final": false },
            ],
        })
    } else if (req.query.prototypeVariant === 'B') {
        res.json({
            "firstDiscounts": [ 
                { "name": "Degustácia remeselných pív", "image": "2B/pivo.jpg", "price": 25.5, "final": false },
                { "name": "Večera v steak house", "image": "2B/steak.jpg", "price": 27.0, "final": false },
                { "name": "Chutná pizza 1+1", "image": "2B/pizza.jpg", "price": 15.5, "final": false },
                { "name": "Hamburger s hranolkami", "image": "2B/hamburger.jpg", "price": 12.9, "final": false },
            ],
            "secondDiscounts": [ 
                { "name": "Chutná pizza 1+1", "image": "2B/pizza.jpg", "price": 15.5, "final": false },
                { "name": "Romantická večera pre 2 osoby", "image": "2B/romanticka_vecera.jpg", "price": 60.0, "final": false},
                { "name": "Indické menu pre 2 osoby", "image": "2B/india.jpg", "price": 16.0, "final": false },
                { "name": "Sushi pre 2 osoby", "image": "2B/sushi.jpg", "price": 18.5, "final": false },
            ],
            "thirdDiscounts": [ 
                { "name": "Romantická večera pre 2 osoby", "image": "2B/romanticka_vecera.jpg", "price": 60.0, "final": false},
                { "name": "Sushi pre 2 osoby", "image": "2B/sushi.jpg", "price": 18.5, "final": false },
                { "name": "Tri chody pre pár u číňana", "image": "2B/cina.jpg", "price": 32.2, "final": false },
                { "name": "Tradičná večera pre 2 osoby", "image": "2B/pirohy.jpg", "price": 26.9, "final": false },
            ],
            "fourthDiscounts": [ 
                { "name": "Degustácia vín pre 2 osoby", "image": "2B/vino.jpg", "price": 25.6, "final": true },
                { "name": "Romantika s pizzou", "image": "2B/pizza.jpg", "price": 26.5, "final": false },
                { "name": "Hamburgery pre 2 osoby", "image": "2B/hamburger.jpg", "price": 27.9, "final": false },
            ],
        })
    } else if (req.query.prototypeVariant === 'C') {
        res.json({
            "firstDiscounts": [ 
                { "name": "Úprava brady", "image": "2C/uprava_brady.jpg", "price": 15.5, "final": false },
                { "name": "Pedikúra", "image": "2C/pedikura.jpg", "price": 20.9, "final": false },
                { "name": "Pánsky strih", "image": "2C/pansky_strih.jpg", "price": 12.5, "final": false },
                { "name": "Dámsky strih", "image": "2C/damsky_strih.jpg", "price": 17.9, "final": false },
            ],
            "secondDiscounts": [ 
                { "name": "Pedikúra", "image": "2C/pedikura.jpg", "price": 20.9, "final": false },
                { "name": "Dámsky strih", "image": "2C/damsky_strih.jpg", "price": 17.9, "final": false },
                { "name": "Omladenie tváre", "image": "2C/omladenie_tvare.jpg", "price": 15.4, "final": false },
                { "name": "Vlasovú kúra", "image": "2C/vlasova_kura.jpg", "price": 13.6, "final": false },
            ],
            "thirdDiscounts": [ 
                { "name": "Omladenie tváre", "image": "2C/omladenie_tvare.jpg", "price": 15.4, "final": false },
                { "name": "Vlasovú kúra", "image": "2C/vlasova_kura.jpg", "price": 13.6, "final": false },
                { "name": "Manikúra", "image": "2C/manikura.jpg", "price": 19.2, "final": false },
                { "name": "Dámsky strih a ošetrenie", "image": "2C/damsky_strih.jpg", "price": 22.9, "final": false },
            ],
            "fourthDiscounts": [ 
                { "name": "Spoločenský účes", "image": "2C/damsky_spolocensky_uces.jpg", "price": 25.0, "final": true},
                { "name": "Odstránenie vrások", "image": "2C/omladenie_tvare.jpg", "price": 18.4, "final": false },
                { "name": "Pedikúra", "image": "2C/pedikura.jpg", "price": 20.9, "final": false },
            ],
        })
    }
})

app.get('/labels2', (req, res) => {

    if (req.query.prototypeVariant === 'A') {
        res.json({
            "sidebarLabelsEn": [ { "label": "Health and beauty", "action": false }, { "label": "Experiences and fun", "action": false },
                                { "label": "Wellness", "action": false }, { "label": "Practical", "action": false }],
            "sidebarLabelsSvk": [ { "label": "Zdravie a krása", "action": false }, { "label": "Zážitky a zábava", "action": true },
                                { "label": "Wellness", "action": false }, { "label": "Praktické", "action": false }],
            "firstUpperLabels": [ { "label": "Pre náročných", "action": false }, { "label": "Pre páry", "action": false }, { "label": "Pre deti", "action": false }, { "label": "Pre rodiny", "action": true }],
            "secondUpperLabels": [ { "label": "Najnovšie", "action": true }, { "label": "Najlacnejšie", "action": false }, { "label": "Najdrahšie", "action": false }, { "label": "Najobľúbenejšie", "action": false }],
            "instructions": [ "Prepnite si <b>jazyk</b> stránky <b>na slovenčinu</b>", 
                                "Zakúpte zľavový kupón na <b>let balónom</b>, určený <b>pre rodinu</b> a patriaci medzi <b>najnovšie</b><br>(tip - kategórie: zážitky a zábava <nobr>-></nobr> pre rodiny <nobr>-></nobr> najnovšie)"
                            ],
            "targetCoupon": { "label": "Kupón na let balónom", "image": "2A/balon.jpg", "price": 180.0, "validity": "31.10.2023", "category": "Zážitky a zábava", "target": "Pre rodiny" }
        })
    } else if (req.query.prototypeVariant === 'B') {
        res.json({
            "sidebarLabelsEn": [ { "label": "Health and beauty", "action": false }, { "label": "Restaurants", "action": false },
                                { "label": "Travel", "action": false }, { "label": "Experiences and fun", "action": false }],
            "sidebarLabelsSvk": [ { "label": "Zdravie a krása", "action": false }, { "label": "Reštaurácie", "action": true },
                                { "label": "Cestovanie", "action": false }, { "label": "Zážitky a zábava", "action": false }],
            "firstUpperLabels": [ { "label": "Pre pánov", "action": false }, { "label": "Pre dámy", "action": false }, { "label": "Pre fajnšmekrov", "action": false }, { "label": "Pre páry", "action": true }],
            "secondUpperLabels": [ { "label": "Najpredávanejšie", "action": true }, { "label": "Najlacnejšie", "action": false }, { "label": "Najdrahšie", "action": false }, { "label": "Odporúčané", "action": false }],
            "instructions": [ "Prepnite si <b>jazyk</b> stránky <b>na slovenčinu</b>", 
                                "Zakúpte zľavový kupón na <b>degustáciu vín pre 2 osoby</b>, určený <b>pre páry</b> a patriaci medzi <b>najpredávanejšie</b><br>(tip - kategórie: reštaurácie <nobr>-></nobr> pre páry <nobr>-></nobr> najpredávanejšie)"
                            ],
            "targetCoupon": { "label": "Kupón na degustáciu vín pre 2 osoby", "image": "2B/vino.jpg", "price": 25.6, "validity": "31.12.2023", "category": "Reštaurácie", "target": "Pre páry" }
        })
    } else if (req.query.prototypeVariant === 'C') {
        res.json({
            "sidebarLabelsEn": [ { "label": "Experiences and fun", "action": false }, { "label": "Health and beauty", "action": false },
                                { "label": "Travel", "action": false }, { "label": "Restaurants", "action": false }],
            "sidebarLabelsSvk": [ { "label": "Zážitky a zábava", "action": false }, { "label": "Zdravie a krása", "action": true },
                                { "label": "Cestovanie", "action": false }, { "label": "Reštaurácie", "action": false }],
            "firstUpperLabels": [ { "label": "Pre deti", "action": false }, { "label": "Pre rodiny", "action": false }, { "label": "Pre neho", "action": false }, { "label": "Pre ňu", "action": true }],
            "secondUpperLabels": [ { "label": "Najobľúbenejšie", "action": true }, { "label": "Najlacnejšie", "action": false }, { "label": "Najdrahšie", "action": false }, { "label": "Najnovšie", "action": false }],
            "instructions": [ "Prepnite si <b>jazyk</b> stránky <b>na slovenčinu</b>", 
                                "Zakúpte zľavový kupón na <b>spoločenský účes</b>, určený <b>pre dámu</b> a patriaci medzi <b>najobľúbenejšie</b><br>(tip - kategórie: zdravie a krása <nobr>-></nobr> pre ňu <nobr>-></nobr> najobľúbenejšie)"
                            ],
            "targetCoupon": { "label": "Kupón na spoločenský účes", "image": "2C/damsky_spolocensky_uces.jpg", "price": 25.0, "validity": "31.8.2023", "category": "Zdravie a krása", "target": "Pre ňu" }
        })
    }
})


app.post('/registration', async (req, res) => {
    //console.log("Body: ", req.body)

    //define error handling
    /*if(req.body.identification.length < 1) {

    } else {
        //res.redirect('/minigame.html')
        res.end(JSON.stringify({result: "ok"}))
    }*/

    const respondent = {
        experience: req.body.experienceRange,
        pcUsage: req.body.pcUsage,
        sex: req.body.sex,
        age: req.body.age,
        employment: req.body.employment
    }
    const session = {
        note: req.body.note,
        prototype: req.body.prototypeNumber
    }
    const result = await dbManager.createRespondentAndSession(respondent, session)

    if (result) {
        res.end(JSON.stringify({ status: 'ok', result: result }))
    } else {
        res.statusCode = 500
        res.end(JSON.stringify({ status: 'err' }))
    }
})

app.post('/registration_session', async (req, res) => {
    const session = {
        respondentId: req.body.respondentId,
        note: req.body.note,
        prototype: req.body.prototypeNumber,
    }

    const result = await dbManager.createSession(session)
    if (result) {
        res.end(JSON.stringify({ status: 'ok', result: result }))
    } else {
        res.statusCode = 500
        res.end(JSON.stringify({ status: 'err' }))
    }
})

app.post('/minigame_result', async (req, res) => {
    const gameResult = {
        sessionId: req.body.sessionId,
        points: req.body.points,
        hits: req.body.hits,
        gameNumber: req.body.gameNumber,
    }
    const result = await dbManager.createGameResult(gameResult)
    if (result) {
        res.end(JSON.stringify({ status: 'ok', result: result }))
    } else {
        res.statusCode = 500
        res.end(JSON.stringify({ status: 'err' }))
    }
})

app.get('/minigame_top_results', async (req, res) => {
    const result = await dbManager.getTopResults()
    if (result) {
        res.end(JSON.stringify({ status: 'ok', result: result }))
    } else {
        res.statusCode = 500
        res.end(JSON.stringify({ status: 'err' }))
    }
})
//server starting
app.listen(8080, () => {
    console.log('Server started...')
})
