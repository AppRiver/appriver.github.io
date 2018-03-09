(function ($, undefined) {
	var listOfRepos = [];
	var orgName = "appriver";

	function addRecentlyUpdatedRepo (repo) {
		var $item = $("<li>");

		var $name = $("<a>").attr("href", repo.html_url).text(repo.name);
		$item.append($("<span>").addClass("name").append($name));

		var formattedDate = new Date(repo.pushed_at).toDateString().replace(/ 0(\d)/, ' $1,');
		var $time = $("<a>").attr("href", repo.html_url + "/commits").text(formattedDate);
		$item.append($("<span>").addClass("time").append($time));

		$item.append('<span class="bullet">&sdot;</span>');

		var $watchers = $("<a>").attr("href", repo.html_url + "/watchers").text(repo.watchers + " watcher" + (repo.watchers === 1 ? "" : "s"));
		$item.append($("<span>").addClass("watchers").append($watchers));

		$item.append('<span class="bullet">&sdot;</span>');

		var $forks = $("<a>").attr("href", repo.html_url + "/network").text(repo.forks + " fork" + (repo.forks === 1 ? "" : "s"));
		$item.append($("<span>").addClass("forks").append($forks));

		$item.appendTo("#recently-updated-repos");
	}

	function addRepo (repo) {
		var $item = $("<li>").addClass("repo grid-1 " + (repo.language || '').toLowerCase());
		var $link = $("<a>").attr("href", repo.html_url).appendTo($item);
		$link.append($("<h2>").text(repo.name));
		if (repo.language !== null) $link.append($("<h3>").text(repo.language));
		$link.append($("<p>").text(repo.description));
		$item.appendTo("#repos");
	}

	function handleError (err) {
		if (console && err) {
			console.error(err);
		}

		if(err) {
			$("#loading-repos").hide();
			if (err.indexOf("API rate limit exceeded" === 0)) {
				$("#rate-limit-exceeded").show();
			}
		}
	}

	function getReposList (repos, page) {
		repos = repos || [];
		page = page || 1;

		var uri = "https://api.github.com/orgs/" + orgName + "/repos?callback=?&per_page=100&page=" + page;

		$.getJSON(uri, function (result) {
			if (result.data.message) {
				handleError(result.data.message);
			}

			if (result.data && result.data.length > 0) {
				repos = repos.concat(result.data);

				getReposList(repos, page + 1);
			} else {
				$("#num-repos").text(repos.length);
				$("#txt-repos").text(repos.length === 1 ? "public repo" : "public repos");

				// Convert pushed_at to Date.
				$.each(repos, function (i, repo) {
					repo.pushed_at = new Date(repo.pushed_at);

					var weekHalfLife = 1.146 * Math.pow(10, -9);

					var pushDelta = (new Date) - Date.parse(repo.pushed_at);
					var createdDelta = (new Date) - Date.parse(repo.created_at);

					var weightForPush = 1;
					var weightForWatchers = 1.314 * Math.pow(10, 7);

					repo.hotness = weightForPush * Math.pow(Math.E, -1 * weekHalfLife * pushDelta);
					repo.hotness += weightForWatchers * repo.watchers / createdDelta;
				});

				// Sort by highest # of watchers.
				repos.sort(function (a, b) {
					if (a.hotness < b.hotness) return 1;
					if (b.hotness < a.hotness) return -1;
					return 0;
				});

				$.each(repos, function (i, repo) {
					addRepo(repo);
				});

				// Sort by most-recently pushed to.
				repos.sort(function (a, b) {
					if (a.pushed_at < b.pushed_at) return 1;
					if (b.pushed_at < a.pushed_at) return -1;
					return 0;
				});

				$.each(repos.slice(0, 3), function (i, repo) {
					addRecentlyUpdatedRepo(repo);
				});
				listOfRepos = repos;
				$("#loading-repos").hide();
			}
		});
	}

	function getMembersList (){
		$.getJSON("https://api.github.com/orgs/" + orgName + "/members?callback=?", function (result) {
			var members = result.data;

			if (result.data.message) {
				handleError(result.data.message);
				$("#num-members").text(0);
			} else {
				$("#num-members").text(members.length);
			}

			$("#txt-members").text(members.length === 1 ? "member" : "members");
		});
	}

	function setupSearch () {
		var searchResult = listOfRepos; 

		//Update the list of results with the search results
		var searchBox = $('#search-box');

		searchBox.keyup(function() {
			searchResult = findMatches(searchBox.val(), listOfRepos);
			$('#repos').empty();
			$.each(searchResult, function (i, repo) {
				addRepo(repo);
			});
		});

		function findMatches(query, repos) {
			if (query === '') {
				return repos;
			} else {
				var options = {
				findAllMatches: true,
				threshold: 0.4,
				location: 0,
				distance: 100,
				maxPatternLength: 50,
				minMatchCharLength: 1,
				keys: [
					"name",
					"language",
					"description"
				]
				};
				var fuse = new Fuse(repos, options);
				var result = fuse.search(query);

				// Sort by highest # of watchers.
				result.sort(function (a, b) {
				if (a.hotness < b.hotness) return 1;
				if (b.hotness < a.hotness) return -1;
				return 0;
				});

				return result;
			}
		}
	}
	
	//Initialize it all!
	getReposList();
	getMembersList();
	setupSearch();
})(jQuery);