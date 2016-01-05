(function ($, undefined) {
	var orgName = "appriver";

	function addRecentlyUpdatedRepo(repo) {
		var $item = $("<li>");

		var $name = $("<a>").attr("href", repo.html_url).text(repo.name);
		$item.append($("<span>").addClass("name").append($name));

		var $time = $("<a>").attr("href", repo.html_url + "/commits").text(strftime("%h %e, %Y", repo.pushed_at));
		$item.append($("<span>").addClass("time").append($time));

		$item.append('<span class="bullet">&sdot;</span>');

		var $watchers = $("<a>").attr("href", repo.html_url + "/watchers").text(repo.watchers +  " watcher" +(repo.watchers===1 ? "" : "s"));
		$item.append($("<span>").addClass("watchers").append($watchers));

		$item.append('<span class="bullet">&sdot;</span>');

		var $forks = $("<a>").attr("href", repo.html_url + "/network").text(repo.forks + " fork" +(repo.forks===1 ? "" : "s"));
		$item.append($("<span>").addClass("forks").append($forks));

		$item.appendTo("#recently-updated-repos");
	}

	function addRepo(repo) {
		var $item = $("<li>").addClass("repo grid-1 " + (repo.language || '').toLowerCase());
		var $link = $("<a>").attr("href", repo.html_url).appendTo($item);
		$link.append($("<h2>").text(repo.name));
		if(repo.language != null) $link.append($("<h3>").text(repo.language));
		$link.append($("<p>").text(repo.description));
		$item.appendTo("#repos");
	}

	function addRepos(repos, page) {
		repos = repos || [];
		page = page || 1;

		var uri = "https://api.github.com/orgs/" + orgName + "/repos?callback=?"
						+ "&per_page=100"
						+ "&page="+page;

		$.getJSON(uri, function (result) {
				if(console && result.data.message){
					console.error(result.data.message)
				}

			if (result.data && result.data.length > 0) {
				repos = repos.concat(result.data);

				addRepos(repos, page + 1);
			}else {
				$("#num-repos").text(repos.length);
				$("#txt-repos").text(repos.length > 1 ? "public repos":"public repo");

				// Convert pushed_at to Date.
				$.each(repos, function (i, repo) {
					repo.pushed_at = new Date(repo.pushed_at);

					var weekHalfLife  = 1.146 * Math.pow(10, -9);

					var pushDelta    = (new Date) - Date.parse(repo.pushed_at);
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
			}
		});
	}

	$(function () {
		addRepos();
		$.getJSON("https://api.github.com/orgs/" + orgName + "/members?callback=?", function (result) {
			var members = result.data;

			if(console && result.data.message){
				console.error(result.data.message)
				$("#num-members").text(0);
			}else{
				$("#num-members").text(members.length);
			}
			
			$("#txt-members").text(members.length > 1 ? "members":"member");
		});
	});

})(jQuery);