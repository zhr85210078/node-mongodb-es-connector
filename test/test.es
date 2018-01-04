Get /myusers/users/_search
{
    "query":{
        "bool":{
             "should":{
                 "match_phrase":{
                     "_id" : "5a1e1f923d960c5dc09321aa"
                     //"name":"test1111"
                 }
             }
        }
    }
}

Get /mycarts/carts/_search
{
    "query":{
        "bool":{
             "should":{
                 "match_phrase":{
                     "_id" : "59b79a0de04b2b69ce423c0c"
                     //"name":"test1111"
                 }
             }
        }
    }
}