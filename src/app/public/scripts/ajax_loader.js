<script>
	$.ajax({
		url: '/pages/commands.html',
		success: function (html) {
			$("#module").html(html);
			window.location.hash = 'commands'
		}
	})
</script>