Vue.config.devtools = true;

Vue.component("page", {
	template: `
    <transition name="fade">
        <div v-show="is_active">
            <slot></slot>
        </div>
    </transition>
    `,
	props: {
		name: {
			require: true
		},
		selected: {
			default: false
		},
		test_stop: {
			type: Boolean
		}
	},
	data() {
		return {
			is_active: true
		};
	},
	mounted() {
		this.is_active = this.selected;
	}
});

new Vue({
	el: "#app",
	data: {
		speaker: {
			english: [
				"UK English Male",
				"UK English Female",
				"US English Female",
				"Australian Female"
			],
			chinese: {
				female: "Chinese Female"
			}
		},
		pages: [],
		vocabularies: [],
		test_seconds: 10,
		test_start: false,
		test_word: "123123",
		test_languages: ["中文", "英文", "中英文"],
		test_language: "",
		test_queue: []
	},
	mounted() {
		this.pages = this.$children;
	},
	methods: {
		select_page(selected_page) {
			this.pages.forEach(page => {
				page.is_active = page.name == selected_page.name;
			});
		},
		open_file(event) {
			var self = this;
			var input = event.target;

			var reader = new FileReader();
			reader.onload = function () {
				var text = reader.result;
				vocabularies = text.split("\n");
				vocabularies.forEach(w => {
					if (w) {
						en_w = w.split(",")[0].trim();
						ch_w = w.split(",")[1].trim();
						self.vocabularies.push([en_w, ch_w]);
					}

				});
			};
			reader.readAsText(input.files[0], "big5");
			console.log(input.files[0]);
			document.getElementById("txt").href = this.make_text_file(
				self.vocabularies.join("\r\n")
			);
			document.getElementById("txt").download = "vocabularies.txt";
		},
		start_test() {
			this.test_start = true;

			var c = this.test_seconds * this.vocabularies.length;
			var t;
			t = setInterval(() => {
				c = c - 1;
				if (c == -1) {
					clearInterval(t);
					this.test_start = false;
				}
			}, 1000);

			let test_vocabularies = this.shuffle(this.vocabularies);
			this.test_queue = test_vocabularies.map((v, i) => {
				return setTimeout(() => {
					if (this.test_language == "中文") {
						let en_speark = this.shuffle(this.speaker.english)
						responsiveVoice.speak(v[0], en_speark[0]);
						this.test_word = v[0];
					} else if (this.test_language == "英文") {
						responsiveVoice.speak(v[1], this.speaker.chinese.female);
						this.test_word = v[1];
					} else {
						random = Math.floor((Math.random() * 100) % 2);
						this.test_word = v[random];
						if (random == 0) {
							let en_speark = this.shuffle(this.speaker.english)
							responsiveVoice.speak(v[random], en_speark[0]);
						} else {
							responsiveVoice.speak(v[random], this.speaker.chinese.female);
						}
					}
				}, 1000 * this.test_seconds * i);
			});
		},
		shuffle(arr) {
			let random_index, temp;
			for (let i = 0; i < arr.length; i++) {
				random_index = Math.floor(Math.random() * (i + 1));
				temp = arr[i];
				arr[i] = arr[random_index];
				arr[random_index] = temp;
			}
			return arr;
		},
		make_text_file(text) {
			var textFile = null;
			var data = new Blob([text], {
				type: "text/plain"
			});

			// If we are replacing a previously generated file we need to
			// manually revoke the object URL to avoid memory leaks.
			if (textFile !== null) {
				window.URL.revokeObjectURL(textFile);
			}

			textFile = window.URL.createObjectURL(data);

			return textFile;
		},
		speak_vocabulary(word) {
			responsiveVoice.speak(word);
		},
		stop_test() {
			this.test_queue.forEach(t => {
				clearTimeout(t);
			});
			this.test_start = false;
		}
	},
	computed: {
		now_test() {
			return this.vocabularies.findIndex((vc) => {
				return vc.indexOf(this.test_word) != -1;
			});
		},
		total_test() {
			return this.vocabularies.length;
		},
		hint_word() {
			let word_combination = this.vocabularies.find((vc) => {
				return vc.indexOf(this.test_word) != -1;
			})
			if (word_combination) {
				let word = word_combination[0]
				return word[0] + '_'.repeat(word.length < 10 ? word.length - 2 : 8) + word[word.length - 1]
			}
		},
		language_of_test_word() {
			return this.vocabularies.find((vc) => {
				return vc.indexOf(this.test_word) != -1 && vc.indexOf(this.test_word) != 0;
			})
		}
	}
});