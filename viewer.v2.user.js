// ==UserScript==
// @name         Sandbox Viewer
// @namespace    https://github.com/vihanb/PPCG-SandboxViewer
// @version      1
// @description  PPCG Sandbox Viewer
// @author       Downgoat
// @match        *.stackexchange.com/*
// @grant        none
// ==/UserScript==
$(document).ready(function() {
  var OPENED = false;
  $("body").prepend('<div id="SandboxViewer" style="display:none; width: inherit; height: inherit;"></div>');
  $('#SandboxViewer').prepend('<div id="SandboxBlur" style="position: fixed;z-index:2;width:100%;height:100%;background:rgba(0,0,0,0.5)"></div>');
  $('#SandboxViewer').append('<div id="SandboxContent" style="position: fixed; overflow: scroll; z-index: 3; width: 90%; max-height: 90%;top: 50%;left: 50%;transform: translateY(-50%) translateX(-50%);background: #FAFAFA;padding: 1em;"><span id="USERLOAD">Loading...</span></div>');

  $(".topbar .topbar-wrapper .network-items").append('<a id="SandboxViewerToggle" class="topbar-icon yes-hover" style="z-index:1;width: 36px; background-image: url(http://i.stack.imgur.com/lBskr.png); background-size: 23px 23px; background-position: 7px 3px;"></a>');

  var POSTCOUNTER = 0;

  function ConstructPost(post) {
    return '<div style="overflow:scroll">' + post.body + '</div>';
  }

  $("#SandboxViewerToggle").click(function() {
    $('#SandboxViewer').fadeIn(100);
    if (OPENED === false) {
      OPENED = true;
      GetChallenges(StackExchange.options.user.userId, function(posts) {
        var HTML = "";
        HTML += '<h1>Your Sandboxed Posts</h1><div><ul>' + posts.map(function(post) {
          return '<li><b><a href="' + post.url + '">' + post.title + '</a></b><span>&nbsp;-&nbsp;' + post.score.up + " upvote" + (post.score.up !== 1 ? "s" : "") + "; " + post.score.down + " downvote" + (post.score.down !== 1 ? "s" : "") + "</span></li>";
        }).join("\n") + '</ul></div>';

        HTML += '<h1>Latest Activity</h1><div>' + GetComments(posts).map(function(comment) {
          return '<b><a href="' + comment.postlink + '">' + comment.post + '</a></b>, <a href="http://codegolf.stackexchange.com/users/' + comment.userid + '">' + comment.user + '</a>: ' + comment.text + " - <a href=\"" + comment.link + "\">" + FormatDate(new Date(comment.timestamp)) + "</a><hr>";
        }).join("") + '</div>';
        $("#SandboxContent").prepend('<div style="width: 38%; float: left">' + HTML + "</div>");
      });
      GetChallenges("*nofilter*", function(posts) {
        var HTML = "";
        HTML += '<h1>Review Posts</h1><div style="text-align: right">' +
          '<button class="sandboxbtn">Skip</button> <button class="sandboxbtn">This challenge has been posted</button>' +
          '<button class="sandboxbtn">-1 Challenge</button> <button class="sandboxbtn">+1 Challenge</button><br>' +
		  '<button>Flag</button> <button>Edit</button> <button>Comment</button>' +
          '</div><hr><div id="SandboxChallengePreview">' + ConstructPost(posts[POSTCOUNTER]) + '</div>';
        $("#SandboxContent").append('<div style="width: 60%; float: right">' + HTML + '</div>');
		$(".sandboxbtn").click(function() {
          $("#SandboxChallengePreview").html(ConstructPost(posts[++POSTCOUNTER]));
		});
      });
      $("#USERLOAD").remove();
    }
  });

  $('#SandboxBlur').click(function() {
    $('#SandboxViewer').fadeOut(100);
  });
});

/*== Functions ==*/
function FormatDate(d) {
  return [d.getMonth() + 1, d.getDate()].join('/') + ' ' + [d.getHours(), d.getMinutes(), d.getSeconds()].join(':');
}

function GetComments(posts) {
  return posts.reduce(function(data, post) {
    var comments = post.comments || [];
    comments.forEach(function(cm) {
      data.push({
        timestamp: cm.creation_date,
        user: cm.owner.display_name,
        userid: cm.owner.user_id,
        postlink: post.post.link,
        link: cm.link,
        text: cm.body,
        post: GetPostTitle(post.post.body_markdown)
      });
    });
    data.sort(function(a, b) {
      return b.timestamp - a.timestamp;
    });
    return data;
  }, []);
}

function GetPostTitle(markdown) {
  return (markdown.match(/(?:\n|^)(?:#+|\*\*)(.+)/) || ["", "Unknown Title"])[1];
}

function GetChallenges(userid, callback) {
  GetUserPosts(userid, function(posts) {
    callback(posts.map(function(post) {
      return {
        title: GetPostTitle(post.body_markdown),
        score: {
          up: post.up_vote_count,
          down: post.down_vote_count
        },
        url: post.link,
        comments: post.comments,
		id: post.answer_id,
		body: post.body,
        post: post
      };
    }));
  });
}

function GetUserPosts(userid, callback) {
  Request("GET", "https://api.stackexchange.com/2.2/questions/2140/answers?order=desc&sort=activity&site=meta.codegolf&filter=!9wQs9*rijGfAx8HBVP.bJ21cgRqrG(XCNUCrB__HBm", function(req) {
    var items = JSON.parse(req.response).items;
    callback(items.filter(function(item) {
      return userid == "*nofilter*" ? item.owner.user_id !== StackExchange.options.user.userId : item.owner.user_id === userid;
    }));
  });
}

function Request(type, url, callback) {
  var r = new XMLHttpRequest();
  r.onreadystatechange = function() {
    if (r.readyState === 4)
      if (r.status === 200) callback(r);
  };
  r.open(type, url);
  if (type.toUpperCase() === "POST") r.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  r.send();
}
