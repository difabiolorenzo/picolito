var object_hot = ""
for (var i in list.hot.text) {
    object_hot += `{pack_name:"never_hot",language:"en",text:"` + list.hot.text[i] + `"},`
}
var object_popular = ""
for (var i in list.popular.text) {
    object_popular += `{pack_name:"never_popular",language:"en",text:"` + list.popular.text[i] + `"},`
}
var object_party = ""
for (var i in list.party.text) {
    object_party += `{pack_name:"never_party",language:"en",text:"` + list.party.text[i] + `"},`
}


//https://psycatgames.com/app/never-have-i-ever/