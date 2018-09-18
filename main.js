var CLIENT_ID = '566690036668-1m6nqeeovhok1r8p80ttkiuvlvoabqop.apps.googleusercontent.com';
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest"];
var SCOPES = 'https://www.googleapis.com/auth/youtube.readonly';

var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');
var content = document.getElementById('content');
var channelForm = document.getElementById('channel-form');
var channelInput = document.getElementById('searchChannel');
var videoContainer = document.getElementById('video-container');
var thumbnailContainer = document.getElementById('channel-thumbnail');
var searchForm = document.getElementById('search-form');
var searchInput = document.getElementById('searchVideo');
var searchContainer = document.getElementById('search-container');
var channelVideoInfo = document.getElementById('channel-video-info');
var searchVideoInfo = document.getElementById('search-video-info');
var loginText = document.getElementById('logText');
var defaultChannel = 'ThrasherMagazine';

//change channel
channelForm.addEventListener('submit', e => {
  e.preventDefault();

  var channel = channelInput.value;
  channel = channel.replace(/\s/g,'');
  getChannel(channel);
})

//new search criteria
searchForm.addEventListener('submit', e => {
  e.preventDefault();

  var searchCriteria = searchInput.value;
  searchCriteria = searchCriteria.replace(/\s/g,'');
  search(searchCriteria);
})

// client load function - called on page load
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

// initialise client - called from load function
function initClient() {
  gapi.client.init({
    discoveryDocs: DISCOVERY_DOCS,
    clientId: CLIENT_ID,
    scope: SCOPES
  }).then(function () {
    //check for sign in changes
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    //process initital sign in state
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
    signoutButton.onclick = handleSignoutClick;
  });
}

//check for signed in status
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'block';
    content.style.display = 'block';
    videoContainer.style.display = 'block';
    loginText.innerHTML = 'Sign Out of your Google Account.';
    getChannel(defaultChannel);
  }
  else {
    authorizeButton.style.display = 'block';
    signoutButton.style.display = 'none';
    content.style.display = 'none';
    videoContainer.style.display = 'none';
    loginText.innerHTML = 'Sign In to your Google Account to access features.';
  }
}

//login
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}
//logout
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}
//display fetched channel data
function showChannelData(data) {
  var channelInfoList = document.getElementById('channel-info');
  channelInfoList.innerHTML = data;
}

//fetch channel data
function getChannel(channel) {
  gapi.client.youtube.channels.list({
    'part': 'snippet,contentDetails,statistics',
    'forUsername': channel
  }).then(function(response){
    console.log(response);
    var channel = response.result.items[0];

    var thumbnail = `<br/><img src="${channel.snippet.thumbnails.high.url}" <alt="Channel Thumbnail Image" width="75%" height="auto">`;
    displayChannelThumbnail(thumbnail);
    var output = `<br/>
      <ul class="list-group">
        <li class="list-group-item">Channel Title: ${channel.snippet.title}</li>
        <li class="list-group-item">ID: ${channel.id}</li>
        <li class="list-group-item">Description: ${channel.snippet.description}</li>
        <li class="list-group-item">Subscribers: ${numberWithComma(channel.statistics.subscriberCount)}</li>
        <li class="list-group-item">Total Views: ${numberWithComma(channel.statistics.viewCount)}</li>
        <li class="list-group-item">Number of Videos: ${numberWithComma(channel.statistics.videoCount)}</li>
      </ul>
      <hr>
      <a class="btn btn-primary offset-md-2" target="_blank" href="https://youtube.com/${channel.snippet.customUrl}">Go to Channel</a>`;
    showChannelData(output);

    var playlistId = channel.contentDetails.relatedPlaylists.uploads;
    requestPlaylist(playlistId);
    })
  .catch(err => alert('Sorry, there is no Youtube channel by that name.'));
}
//place commas in large integers for readability
function numberWithComma(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

//display's the channel's primary thumbnail image
function displayChannelThumbnail(thumbnail) {
  var channelThumbnailImage = document.getElementById('channel-thumbnail');
  channelThumbnailImage.innerHTML = thumbnail;
}

//get  and display channel's related playlist
function requestPlaylist(playlistId) {
  var requestOptions = {
    'playlistId': playlistId,
    'part': 'snippet',
    maxResults: 12
  }

  var request = gapi.client.youtube.playlistItems.list(requestOptions);

  request.execute(response => {
    console.log(response);
    var responseItems = response.result.items;
    if(responseItems) {
      let vidOutput = '<h5>Latest Videos</h5>';
      let channelVidInfo = '<h5>Channel Video Information</h5><ul class="collection">';
      let count = 1;

      //loop adding videos to output
      responseItems.forEach(item => {
        var videoId = item.snippet.resourceId.videoId;
        var channelVideoThumbnailUrl = `<img src="${item.snippet.thumbnails.default.url}" <alt="Video Thumbnail Image" width="5%" height="auto">`;
        var channelVideoTitle = item.snippet.title;
        var channelVideoDescription = item.snippet.description;

        vidOutput += `
                    <iframe width="32%" height="auto" src="https://www.youtube.com/embed/${videoId}"
                    frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
                  `;

        channelVidInfo += `
                    <ul class="list-group">
                      <li class="list-group-item">${channelVideoThumbnailUrl}&nbsp&nbsp Video Title: ${channelVideoTitle}</li>`;
      });

      channelVidInfo += '</ul>';
      //video output - outside loop
      videoContainer.innerHTML = vidOutput;
      channelVideoInfo.innerHTML = channelVidInfo;

    }
    else {
      videoContainer.innerHTML = 'No Videos to Display';
    }
  });
}

// get and dislpay search results based on inputted criteria
function search(searchCriteria) {
  var q = $('#searchVideo').val();
  gapi.client.youtube.search.list({
    q: searchCriteria,
    part: 'snippet',
    maxResults: 9
  }).then(function(response) {
    console.log(response);
    var searchResults = response.result.items;
    if(searchResults) {
      let searchOutput = '<br/><h4>Search Results</h4>';
      let searchVidInfo = '<br/><h5>Search Results Information</h5><ul class="collection">';

      //loop adding videos to output
      searchResults.forEach(item => {
        var searchId = item.id.videoId;
        var searchVideoThumbnailUrl = `<img src="${item.snippet.thumbnails.default.url}" <alt="Video Thumbnail Image" width="10%" height="auto">`;
        var searchVideoTitle = item.snippet.title;

        searchOutput += `
                    <iframe width="32%" height="auto" src="https://www.youtube.com/embed/${searchId}"
                    frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
                  `;

        searchVidInfo += `
                    <ul class="list-group">
                      <li class="list-group-item">${searchVideoThumbnailUrl}&nbsp&nbsp Video Title: ${searchVideoTitle}</li>`;
      });

      searchVidInfo += '</ul>';
      //video video output
      searchContainer.innerHTML = searchOutput;
      searchVideoInfo.innerHTML = searchVidInfo;
    }
    else {
      searchContainer.innerHTML = 'No Videos to Display';
    }
  });
}
