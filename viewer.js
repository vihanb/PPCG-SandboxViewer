var GETPOSTS = "https://api.stackexchange.com/2.2/questions/2140/answers?order=desc&sort=activity&site=meta.codegolf&filter=!)-gsFaSk.oj2nuNj6)8Hom.rAmUEuzZB.r0FZLYI";

function GetChallenges(user, callback) {
  GetUserPosts(user, function(posts) {
    callback(posts.map(function(post) {
      return {
        title: (post.body_markdown.match(/(?:^|\n)\s*(?:#+|\*\*)(.+?)(?:\*\*|#|\n|$)/)||["","Unknown Title"])[1],
        score: {
          up: post.up_vote_count,
          down: post.down_vote_count
        },
        url: post.link,
        comments: post.comments,
        post: post
      }
    }));
  });
}

function GetUserPosts(displayname, callback) {
  Request("GET", GETPOSTS, function(req) {
    var items = JSON.parse(req.response).items;
    callback(items.filter(function(item) {
      return item.owner.display_name  === displayname;
    }));
  });
}

function Request(type, url, callback) {
  var r = new XMLHttpRequest();
  r.onreadystatechange = function() {
    if (r.readyState === 4) if (r.status === 200) callback(r);
  };
  r.open(type, url);
  if (type.toUpperCase() === "POST") r.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  r.send();
}
