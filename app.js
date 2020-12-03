/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
const { application, json } = require('express');
const { post } = require('request');

var client_id = '5f3eeaac451a4723ba3bb184e169a16e'; // Your client id
var client_secret = 'a0a4fbb9c5de4abd9da311983931f030'; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri





/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email playlist-read-private playlist-modify-public playlist-modify-private';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});
  var playlistId;



  /*

    -------------------------------------------
                      POSTING
    -------------------------------------------

  */
function addTrack(track,token)
{
  var link={
    url: `https://api.spotify.com/v1/playlists/`+playlistId+'/tracks?uris='+track,
    headers: { 
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    json:true
    }
    request.post(link,function(err,res,body)
    {});
}

 function createPlaylist(token) {
      var link={
      url: `https://api.spotify.com/v1/users/y8xyv2ndr98asvg5eo96yhjny/playlists`,
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: {
          "name": "Recomandari",
          "description": "Playlist generat automat, deoarece am un discover weekly in care toate melodiile sunt JALNICE!",
          public: false
      },
      json:true
      }
      request.post(link, function(error,res,body){
        playlistId=body.id;
      });
    }

  /*

    -------------------------------------------
                      GETTING
    -------------------------------------------
    
  */

function getRecommendations(access_token,a,n)
{
  token = "Bearer " +access_token;
  n=a.length;
  url="https://api.spotify.com/v1/recommendations?limit=3&seed_tracks=";
  for (let i=0;i<n;i++){
    if (i!=n-1)
    {
    url+=a[i]+',';
    }
    else 
    {
      url+=a[i];
    }
  }
  console.log(url);
  request.get({url,headers:{"Authorization":token},json:true}, function(error, res, body) {
    var limitNumber=body.tracks.length;
    for (let j=0;j<limitNumber;j++)
    {
      addTrack(body.tracks[j].uri,access_token);
    }
    });
  
}

function getTracks(access_token,playlist)
{
  number= playlist.id;
  var link = {
    url: 'https://api.spotify.com/v1/playlists/'+number+'/tracks',
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };
  request.get(link, function(error, res, items) 
  {
    let n=items.total; // Tracks in playlist
    for (let j=0;j<n;j++) // Recommendations on all tracks
    {
      var a = [];
      var i;
      var trackNr=1;
      for (i=0;i<trackNr;i++)  // 1 track per url
      {
        a[i]=items.items[j].track.id;
      }
      getRecommendations(access_token,a);
      j++; 
      console.log(playlist.name + ' ' + j);
    }
  });
};


function getPlaylists(access_token)
{
var link = {
  url: 'https://api.spotify.com/v1/me/playlists?limit=50',
  headers: { 'Authorization': 'Bearer ' + access_token },
  json: true
};

request.get(link, function(error, res, body) 
{
  if (!error && res.statusCode === 200) {
  var n = body.total;
  var ok = 0;
  for (let j=0;j<2;j++)
  {
    if (body.items[j].name == "Recomandari"){
      playlistId=body.items[j].id;
      ok=1;
    }
  }
  if (ok==0) createPlaylist(access_token);
  for (let i=1;i<2;i++){
  getTracks(access_token,body.items[i]);
  }
  }
});
}

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        // use the access token to access the Spotify Web API
        var linkul = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };
       request.get(linkul, function(err,res,body)
       {
        getPlaylists(access_token);
       });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

console.log('Listening on 8888');
app.listen(8888);

