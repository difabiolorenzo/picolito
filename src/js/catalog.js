// Catalogue des bases de phrases intégrées (pack entries) et du mix.
// Dépend de rien ; chargé après rng.js, types.js et cards.js (avant main.js).

const VANILLA_DB_INDEX = [
    // Picolo
    // Picolo — default
        {   
        "gamemode": "picolo",
        "id": "picolo_default_da",
        "pack_name": "Before - 🥴",
        "pack_description": "Det perfekte spil til at sætte gang i festen.\nGør dig klar - Picolito giver ingen nåde.",
        "url": "./src/db/picolo/default_da.json",
        "language": "da"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_default_de",
        "pack_name": "Before - 🥴",
        "pack_description": "Das perfekte Spiel, um die Party in Schwung zu bringen.\nSeid bereit, Picolito kennt keine Gnade.",
        "url": "./src/db/picolo/default_de.json",
        "language": "de"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_default_es",
        "pack_name": "Before - 🥴",
        "pack_description": "El modo de juego perfecto para animar cualquier fiesta.\n¡Preparaos, Picolito no va a tener piedad!",
        "url": "./src/db/picolo/default_es.json",
        "language": "es"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_default_fi",
        "pack_name": "Before - 🥴",
        "pack_description": "Täydellinen peli iltaisten juhlien virittämiseen.\nOlette valmiit, Picolito ei anna mitään anteeksi.",
        "url": "./src/db/picolo/default_fi.json",
        "language": "fi"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_default_ja",
        "pack_name": "Before - 🥴",
        "pack_description": "パーティーを盛り上げるのに最高のゲーム。\n準備して、Picolito は容赦しません。",
        "url": "./src/db/picolo/default_ja.json",
        "language": "ja"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_default_ko",
        "pack_name": "Before - 🥴",
        "pack_description": "파티 분위기를 끌어올리는 최고의 게임.\n준비하세요, Picolito는 봐주지 않습니다.",
        "url": "./src/db/picolo/default_ko.json",
        "language": "ko"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_default_nb",
        "pack_name": "Before - 🥴",
        "pack_description": "Det perfekte spillet for å sette stemning på kvelden.\nGjør deg klar - Picolito gir ikke nåde.",
        "url": "./src/db/picolo/default_nb.json",
        "language": "nb"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_default_nl",
        "pack_name": "Before - 🥴",
        "pack_description": "Het perfecte spel om de sfeer er van te halen.\nMaak je klaar, Picolito kent geen genade.",
        "url": "./src/db/picolo/default_nl.json",
        "language": "nl"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_default_pt",
        "pack_name": "Before - 🥴",
        "pack_description": "O modo de jogo perfeito para animar as festas.\nPreparem-se, o Picolito não vai ter piedade!",
        "url": "./src/db/picolo/default_pt.json",
        "language": "pt"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_default_ru",
        "pack_name": "Before - 🥴",
        "pack_description": "Идеальная игра для весёлой компании.\nПриготовьтесь - Picolito не будет щадить.",
        "url": "./src/db/picolo/default_ru.json",
        "language": "ru"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_default_sv",
        "pack_name": "Before - 🥴",
        "pack_description": "Det perfekta spelet för att sätta stämning på kvällen.\nVar redo - Picolito skonar ingen.",
        "url": "./src/db/picolo/default_sv.json",
        "language": "sv"
    },
    {   
        "gamemode":"picolo",
        "id":"picolo_default_fr",
        "pack_name": "Before - 🥴",
        "pack_description": "Le mode de jeu parfait pour s'ambiancer en soirées.\nSoyez prêts, car Picolito ne vous fera pas de cadeaux.",
        "url":"./src/db/picolo/default_fr.json",
        "language":"fr"
    },
    {   
        "gamemode":"picolo",
        "id":"picolo_default_en",
        "pack_name": "Getting Started - 🥴",
        "pack_description": "The perfect way to start the party and add some fun to your night.\nGet ready, picolo shows no mercy.",
        "url":"./src/db/picolo/default_en.json",
        "language":"en"
    },
    {   
        "gamemode":"picolo",
        "id":"picolo_default_it",
        "pack_name": "Pre-Party - 🥴",
        "pack_description": "La modalità ideale per ambientarsi.\nTenetevi pronti perchè Picolo non farà regali.",
        "url":"./src/db/picolo/default_it.json",
        "language":"it"
    },




    // Picolo — silly
    {   
        "gamemode": "picolo",
        "id": "picolo_silly_da",
        "pack_name": "On est débiles - 🤪",
        "pack_description": "Hvis du allerede er fuld og skø, er denne pakke lavet til dig.\nAdvarsel - forudeholdt publikum.",
        "url": "./src/db/picolo/silly_da.json",
        "language": "da"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_silly_de",
        "pack_name": "On est débiles - 🤪",
        "pack_description": "Wenn ihr schon völlig benebelt und albern seid, ist dieses Pack genau richtig.\nVorsicht, liebes Publikum.",
        "url": "./src/db/picolo/silly_de.json",
        "language": "de"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_silly_es",
        "pack_name": "On est débiles - 🤪",
        "pack_description": "Si ya estáis bien borrachos y payasos, este pack es para vosotros.\nAtención, público avisado.",
        "url": "./src/db/picolo/silly_es.json",
        "language": "es"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_silly_fi",
        "pack_name": "On est débiles - 🤪",
        "pack_description": "Jos olette jo humaltuneita ja hassuja kuin jalat, tämä pakkaus on teille.\nVaroitus - kokenut yleisö.",
        "url": "./src/db/picolo/silly_fi.json",
        "language": "fi"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_silly_ja",
        "pack_name": "On est débiles - 🤪",
        "pack_description": "既にぐすぐすで馬鹿みたいな人に特化したパック。\n判断力がある人向けです。",
        "url": "./src/db/picolo/silly_ja.json",
        "language": "ja"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_silly_ko",
        "pack_name": "On est débiles - 🤪",
        "pack_description": "이미 주저앉아 발보다 바보 같은 사람들을 위한 팩.\n분신이 있는 분들께.",
        "url": "./src/db/picolo/silly_ko.json",
        "language": "ko"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_silly_nb",
        "pack_name": "On est débiles - 🤪",
        "pack_description": "Hvis du allerede er full og tullete, er denne pakken laget for deg.\nAdvarsel, erfaren publikum.",
        "url": "./src/db/picolo/silly_nb.json",
        "language": "nb"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_silly_nl",
        "pack_name": "On est débiles - 🤪",
        "pack_description": "Als jullie al dronken en dom zijn, is deze pakket voor jullie.\nLet op, gezond verstand.",
        "url": "./src/db/picolo/silly_nl.json",
        "language": "nl"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_silly_pt",
        "pack_name": "On est débiles - 🤪",
        "pack_description": "Se já estão bem bêbados e malucos, este pack é para vocês.\nAtenção, público avisado.",
        "url": "./src/db/picolo/silly_pt.json",
        "language": "pt"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_silly_ru",
        "pack_name": "On est débiles - 🤪",
        "pack_description": "Если вы уже сильно выпили и дурачитесь, этот набор для вас.\nВнимание, для адекватных.",
        "url": "./src/db/picolo/silly_ru.json",
        "language": "ru"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_silly_sv",
        "pack_name": "On est débiles - 🤪",
        "pack_description": "Om ni redan är fulla och tokiga, är det här paketet till er.\nVarning - för vettiga.",
        "url": "./src/db/picolo/silly_sv.json",
        "language": "sv"
    },
    {   
        "gamemode":"picolo",
        "id":"picolo_silly_fr",
        "pack_name": "On est débiles - 🤪",
        "pack_description": "Si vous êtes déjà bien entamés et cons comme vos pieds, ce pack est fait pour vous.\nAttention, public averti.",
        "url":"./src/db/picolo/silly_fr.json",
        "language":"fr"
    },
    {   
        "gamemode":"picolo",
        "id":"picolo_silly_en",
        "pack_name": "Getting Crazy - 🤪",
        "pack_description": "If you want the night to get even more ridiculous, this game is for you.\nHope you've got a decent buzz going.",
        "url":"./src/db/picolo/silly_en.json",
        "language":"en"
    },
    {   
        "gamemode":"picolo",
        "id":"picolo_silly_it",
        "pack_name": "Siamo scemi - 🤪",
        "pack_description": "Se volete che la notte sia ancora più pazza, questo gioco fa per voi. Solo per i giocatori più selvaggi!",
        "url":"./src/db/picolo/silly_it.json",
        "language":"it"
    },

    


    // Picolo — bar
    {   
        "gamemode":"picolo",
        "id":"picolo_bar_fr",
        "pack_name": "Bar - 🍻",
        "pack_description": "Si vous êtes prêt à retourner le bar, c'est le mode de jeu parfait.\nAttention, il ne faut pas avoir peur du ridicule.",
        "url":"./src/db/picolo/bar_fr.json",
        "language":"fr"
    },
    {   
        "gamemode":"picolo",
        "id":"picolo_bar_en",
        "pack_name": "Bar - 🍻",
        "pack_description": "If you're ready to turn the bar upside down, this is the perfect game.\nBe prepared to face ridicule.",
        "url":"./src/db/picolo/bar_en.json",
        "language":"en"
    },
    {   
        "gamemode":"picolo",
        "id":"picolo_bar_it",
        "pack_name": "Bar - 🍻",
        "pack_description": "Se siete pronti a mettere il bar sottosopra allora avete lo spirito giusto per fare questo gioco.\nAttenzione: vietato vergognarsi !",
        "url":"./src/db/picolo/bar_it.json",
        "language":"it"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_bar_da",
        "pack_name": "Bar - 🍻",
        "pack_description": "Er du klar til at smadre baren, er dette det perfekte spil.\nPas på - vær ikke bange for at se latterligt ud.",
        "url": "./src/db/picolo/bar_da.json",
        "language": "da"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_bar_de",
        "pack_name": "Bar - 🍻",
        "pack_description": "Wenn du bereit bist, den Bar auf den Kopf zu stellen, ist das das perfekte Spiel.\nAchtung - keine Angst vor Peinlichkeit.",
        "url": "./src/db/picolo/bar_de.json",
        "language": "de"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_bar_es",
        "pack_name": "Bar - 🍻",
        "pack_description": "Si estáis listos para dar la vuelta al bar, este es el modo de juego perfecto.\nCuidado, no temáis quedar ridículos.",
        "url": "./src/db/picolo/bar_es.json",
        "language": "es"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_bar_fi",
        "pack_name": "Bar - 🍻",
        "pack_description": "Jos olette valmiita kääntämään baarin ylösalaisin, tämä on täydellinen peli.\nVarokaa, älkää pelätkää naurettavuutta.",
        "url": "./src/db/picolo/bar_fi.json",
        "language": "fi"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_bar_ja",
        "pack_name": "Bar - 🍻",
        "pack_description": "Bar をひっくり返す覚悟があるなら、これが最高のゲーム。\n笑いを気にしないでください。",
        "url": "./src/db/picolo/bar_ja.json",
        "language": "ja"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_bar_ko",
        "pack_name": "Bar - 🍻",
        "pack_description": "바를 뒤집을 각오가 되었다면, 이게 최고의 게임입니다.\n우스러워지는 걸 두려워하지 마세요.",
        "url": "./src/db/picolo/bar_ko.json",
        "language": "ko"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_bar_nb",
        "pack_name": "Bar - 🍻",
        "pack_description": "Er du klar til å snu baren på hodet, er dette det perfekte spillet.\nPass på - ikke vær redd for å se komisk ut.",
        "url": "./src/db/picolo/bar_nb.json",
        "language": "nb"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_bar_nl",
        "pack_name": "Bar - 🍻",
        "pack_description": "Als je klaar bent om de bar op zijn kop te zetten, is dit het perfecte spel.\nLet op, wees niet bang om er dom uit te zien.",
        "url": "./src/db/picolo/bar_nl.json",
        "language": "nl"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_bar_pt",
        "pack_name": "Bar - 🍻",
        "pack_description": "Se estão prontos para deitar o bar abaixo, este é o modo de jogo perfeito.\nCuidado, não temam parecer ridículos.",
        "url": "./src/db/picolo/bar_pt.json",
        "language": "pt"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_bar_ru",
        "pack_name": "Bar - 🍻",
        "pack_description": "Если вы готовы перевернуть бар вверх дном, это идеальная игра.\nОсторожно, не бойтесь выглядеть нелепо.",
        "url": "./src/db/picolo/bar_ru.json",
        "language": "ru"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_bar_sv",
        "pack_name": "Bar - 🍻",
        "pack_description": "Är du redo att vända baren upp och ner, är det här det perfekta spelet.\nVarning - var inte rädd för att se löjlig ut.",
        "url": "./src/db/picolo/bar_sv.json",
        "language": "sv"
    },
    





    // Picolo — hot
    {   
        "gamemode": "picolo",
        "id": "picolo_hot_da",
        "pack_name": "Caliente - 🍆",
        "pack_description": "Med frække spørgsmål - vær klar til at afsløre dine bedst bevarede hemmeligheder.\nGår det lidt vildt i natten?",
        "url": "./src/db/picolo/hot_da.json",
        "language": "da"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_hot_de",
        "pack_name": "Caliente - 🍆",
        "pack_description": "Mit frechen Fragen - seid bereit, eure gutsbewahrtesten Geheimnisse zu lüften.\nWird es heute Nacht etwas heftig?",
        "url": "./src/db/picolo/hot_de.json",
        "language": "de"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_hot_es",
        "pack_name": "Caliente - 🍆",
        "pack_description": "Con preguntas coquinas, preparaos para revelar vuestros secretos mejor guardados.\n¿Va a ser una noche movida?",
        "url": "./src/db/picolo/hot_es.json",
        "language": "es"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_hot_fi",
        "pack_name": "Caliente - 🍆",
        "pack_description": "Roolkkaita kysymyksiä - olette valmiit paljastamaan parhaiten piilotetut salaisuutenne.\nTuleeko tänään ilta riehakka?",
        "url": "./src/db/picolo/hot_fi.json",
        "language": "fi"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_hot_ja",
        "pack_name": "Caliente - 🍆",
        "pack_description": "大胆な質問が勢揃い - 誰にも話していない秘密をさらけ出そう。\n今夜はちょっと刺激的になるかな？",
        "url": "./src/db/picolo/hot_ja.json",
        "language": "ja"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_hot_ko",
        "pack_name": "Caliente - 🍆",
        "pack_description": "대담한 질문 모음 - 아무에게도 말하지 않은 속 숨겨온 비밀을 털어놓으세요.\n오늘 밤 꽤 자극적이겠어요?",
        "url": "./src/db/picolo/hot_ko.json",
        "language": "ko"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_hot_nb",
        "pack_name": "Caliente - 🍆",
        "pack_description": "Med frekke spørsmål - vær klar til å avsløre dine best bevarte hemmeligheter.\nBlir det litt villere i kveld?",
        "url": "./src/db/picolo/hot_nb.json",
        "language": "nb"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_hot_nl",
        "pack_name": "Caliente - 🍆",
        "pack_description": "Met schaamloze vragen - maak je klaar om je best bewaarde geheimen te verklappen.\nGaat het vanavond een beetje wild?",
        "url": "./src/db/picolo/hot_nl.json",
        "language": "nl"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_hot_pt",
        "pack_name": "Caliente - 🍆",
        "pack_description": "Com perguntas picantes - preparem-se para revelar os vossos segredos mais bem guardados.\nVai ser uma noite picante, não vai?",
        "url": "./src/db/picolo/hot_pt.json",
        "language": "pt"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_hot_ru",
        "pack_name": "Caliente - 🍆",
        "pack_description": "Дерзкие вопросы - приготовьтесь раскрыть свои сокровенные тайны.\nБудет горячо сегодня?",
        "url": "./src/db/picolo/hot_ru.json",
        "language": "ru"
    },
    {   
        "gamemode": "picolo",
        "id": "picolo_hot_sv",
        "pack_name": "Caliente - 🍆",
        "pack_description": "Med fräcka frågor - var redo att avslöja dina bäst bevarade hemligheter.\nBlir det rätt vilt ikväll?",
        "url": "./src/db/picolo/hot_sv.json",
        "language": "sv"
    },
    {   
        "gamemode":"picolo",
        "id":"picolo_hot_fr",
        "pack_name": "Caliente - 🍆",
        "pack_description": "Orienté questions coquines, soyez prêts à dévoiler vos secrets les mieux gardés.\nEst-ce que ça va pécho ce soir ?",
        "url":"./src/db/picolo/hot_fr.json",
        "language":"fr"
    },
    {   
        "gamemode":"picolo",
        "id":"picolo_hot_en",
        "pack_name": "Caliente - 🍆",
        "pack_description": "Time to get a little naughty.\nBe prepared to reveal your best-kept secrets",
        "url":"./src/db/picolo/hot_en.json",
        "language":"en"
    },
    {   
        "gamemode":"picolo",
        "id":"picolo_hot_it",
        "pack_name": "Hot - 🍆",
        "pack_description": "Domande maliziose, tenetevi pronti a divulgare i vostri segreti più intimi. Qualcuno limonerà stasera ?",
        "url":"./src/db/picolo/hot_it.json",
        "language":"it"
    },



    // Picolo — war
    {   
        "gamemode":"war",
        "id":"picolo_war_fr",
        "pack_name": "Guerre - 🌩",
        "pack_description": "Affrontez-vous en équipe! Soyez solidaires et n'ayez aucune pitié...\nCe soir c'est la guerre !",
        "url":"./src/db/picolo/war_fr.json",
        "language":"fr"
    },
    {   
        "gamemode":"war",
        "id":"picolo_war_en",
        "pack_name": "War - 🌩",
        "pack_description": "Friends, come together!\nShow your opponents no mercy, for tonight is war!",
        "url":"./src/db/picolo/war_en.json",
        "language":"en"
    },
    {   
        "gamemode":"war",
        "id":"picolo_war_it",
        "pack_name": "Guerra - 🌩",
        "pack_description": "Sfidatevi a squadre ! Siate solidali a non abbiate nessuna pietà per i vostri avversari... Stasera è guerra !",
        "url":"./src/db/picolo/war_it.json",
        "language":"it"
    },
    {   
        "gamemode": "war",
        "id": "picolo_war_da",
        "pack_name": "Guerre - 🌩",
        "pack_description": "Sammen mod fjenderne! Stå sammen, og vis ingen nåde...\nI nat er der krig!",
        "url": "./src/db/picolo/war_da.json",
        "language": "da"
    },
    {   
        "gamemode": "war",
        "id": "picolo_war_de",
        "pack_name": "Guerre - 🌩",
        "pack_description": "Team gegen Team! Haltet zusammen und habt kein Erbarmen...\nHeute Nacht ist Krieg!",
        "url": "./src/db/picolo/war_de.json",
        "language": "de"
    },
    {   
        "gamemode": "war",
        "id": "picolo_war_es",
        "pack_name": "Guerre - 🌩",
        "pack_description": "¡Equipos enfrentados! Sed unidos y no tengáis piedad...\n¡Esta noche es la guerra!",
        "url": "./src/db/picolo/war_es.json",
        "language": "es"
    },
    {   
        "gamemode": "war",
        "id": "picolo_war_fi",
        "pack_name": "Guerre - 🌩",
        "pack_description": "Tiimittäin kamppailuun! Pysykää yhdessä älkääkä armautika...\nTänä yönä on sotaa!",
        "url": "./src/db/picolo/war_fi.json",
        "language": "fi"
    },
    {   
        "gamemode": "war",
        "id": "picolo_war_ja",
        "pack_name": "Guerre - 🌩",
        "pack_description": "チームで対決! 仲間は一つになれ、そして容赦するな...\n今夜は戦争だ!",
        "url": "./src/db/picolo/war_ja.json",
        "language": "ja"
    },
    {   
        "gamemode": "war",
        "id": "picolo_war_ko",
        "pack_name": "Guerre - 🌩",
        "pack_description": "팀으로 대결! 동료들과 하나가 되며, 봐주지 마세요...\n오늘 밤은 전쟁이다!",
        "url": "./src/db/picolo/war_ko.json",
        "language": "ko"
    },
    {   
        "gamemode": "war",
        "id": "picolo_war_nb",
        "pack_name": "Guerre - 🌩",
        "pack_description": "Lag mot lag! Hold sammen og vis ingen nåd...\nI natt er det krig!",
        "url": "./src/db/picolo/war_nb.json",
        "language": "nb"
    },
    {   
        "gamemode": "war",
        "id": "picolo_war_nl",
        "pack_name": "Guerre - 🌩",
        "pack_description": "Team tegen team! Houdt elkaar vast en wees meedogenloos...\nVanavond is het oorlog!",
        "url": "./src/db/picolo/war_nl.json",
        "language": "nl"
    },
    {   
        "gamemode": "war",
        "id": "picolo_war_pt",
        "pack_name": "Guerre - 🌩",
        "pack_description": "Equipas frente a equipas! Sejam solidários e não tenham piedade...\nHoje é dia de guerra!",
        "url": "./src/db/picolo/war_pt.json",
        "language": "pt"
    },
    {   
        "gamemode": "war",
        "id": "picolo_war_ru",
        "pack_name": "Guerre - 🌩",
        "pack_description": "Команда против команды! Держитесь вместе и не щадите никого...\nСегодня война!",
        "url": "./src/db/picolo/war_ru.json",
        "language": "ru"
    },
    {   
        "gamemode": "war",
        "id": "picolo_war_sv",
        "pack_name": "Guerre - 🌩",
        "pack_description": "Lag mot lag! Håll ihop och visa ingen nåd...\nIkväll är det krig!",
        "url": "./src/db/picolo/war_sv.json",
        "language": "sv"
    },

    

    // Je N'ai Jamais
    {   
        "gamemode":"je_n_ai_jamais",
        "id":"je_n_ai_jamais_popular_fr",
        "pack_name": "Populaire - ⭐",
        "pack_description": "Les grands classiques du « Je n'ai jamais » pour briser la glace.\nChiche, vous répondez ?",
        "url":"./src/db/je_n_ai_jamais/popular_fr.json",
        "language":"fr"
    },
    {   
        "gamemode":"je_n_ai_jamais",
        "id":"je_n_ai_jamais_popular_en",
        "pack_name": "Popular - ⭐",
        "pack_description": "The classic \"Never have I ever\" favourites to break the ice.\nDare to answer?",
        "url":"./src/db/je_n_ai_jamais/popular_en.json",
        "language":"en"
    },
    {   
        "gamemode":"je_n_ai_jamais",
        "id":"je_n_ai_jamais_party_fr",
        "pack_name": "Fête - 🎉",
        "pack_description": "Des défis déjantés pour mettre le feu à la soirée.\nAllez, assume !",
        "url":"./src/db/je_n_ai_jamais/party_fr.json",
        "language":"fr"
    },
    {   
        "gamemode":"je_n_ai_jamais",
        "id":"je_n_ai_jamais_party_en",
        "pack_name": "Party - 🎉",
        "pack_description": "Crazy dares to kick the party into high gear.\nGo on, own up!",
        "url":"./src/db/je_n_ai_jamais/party_en.json",
        "language":"en"
    },
    {   
        "gamemode":"je_n_ai_jamais",
        "id":"je_n_ai_jamais_hot_fr",
        "pack_name": "Coquin & Sexy - 💋",
        "pack_description": "Attention, ça va chauffer !\nPrêts à révéler vos secrets les plus coquins ?",
        "url":"./src/db/je_n_ai_jamais/hot_fr.json",
        "language":"fr"
    },
    {   
        "gamemode":"je_n_ai_jamais",
        "id":"je_n_ai_jamais_hot_en",
        "pack_name": "Dirty & Sex - 💋",
        "pack_description": "Things are about to heat up!\nReady to spill your spiciest secrets?",
        "url":"./src/db/je_n_ai_jamais/hot_en.json",
        "language":"en"
    },

    // Maillon Faible
    {   
        "gamemode":"maillon_faible",
        "id":"maillon_faible_fr",
        "pack_name": "Le Maillon Faible",
        "pack_description": "Vous êtes le maillon faible, au revoir.",
        "url":"./src/db/questions/maillon_faible/maillon_faible.json",
        "language":"fr"
    },

    // Question pour un Picton
    {
        "gamemode": "question_pour_un_champion",
        "id": "question_pour_un_picton_fr",
        "language": "fr",
        "pack_name": "Question pour un Picton",
        "pack_description": "Top c'est parti ! C'est pas parti. C'est reparti partout par terre.",
        "url": "./src/db/questions/question_pour_un_picton/question_pour_un_picton.json"
    },
    {
        "gamemode": "question_pour_un_champion",
        "id": "question_pour_un_champion_fr",
        "language": "fr",
        "pack_name": "Question pour un Champion",
        "pack_description": "Pack complet des séries 1 à 51, condensé 2005-2015 et co-rédigé 2024 des jeux joués aux clubs de Paris 2 et de Saint-Germain-en-Laye",
        "url": "./src/db/questions/question_pour_un_champion/question_pour_un_champion_fr.json"
    }
];

const MIX_ALLOWED_QUESTION_TYPES = ["question_picolito", "neuf_points_gagnants"];
