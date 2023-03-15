import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import * as path from "path";
import { writeFile } from "file_util";
import { updateHexoPage, uploadBlogSource } from "hexo_util";
import { generateFullBlog, processImages } from "blog_process";

interface MyPluginSettings {
	hexoRoot: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	hexoRoot: ""
}

const BLOG_TITLE:     string = "标题"
const BLOG_TAG: 	  string = "标签"
const BLOG_CATEGORY:  string = "分类"
const BLOG_POST_BLOG: string = "发布"

const HEXO_BLOG_SOURCE_PATH  = "/source/_posts"
const HEXO_BLOG_SOURCE_IMAGES_PATH  = "/source/imgs"

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		let that = this;
		this.addCommand({
			id: 'post-blog-to-hexo-command',
			name: 'post blog to hexo',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const onSubmit = (title: string, tag: string, category: string, content: string) => {
					if (!(this.settings.hexoRoot && this.settings.hexoRoot.length > 0)) {
						new Notice("请先设置hexo根目录");
						return;
					}

					if (!(title && title.length > 0)) {
						new Notice("标题为空");
						return;
					}

					let fullBlog = generateFullBlog(title, tag, category, content)

					let fileName = title + ".md";
					let dirPath = path.join(this.settings.hexoRoot, HEXO_BLOG_SOURCE_PATH)

					let imgDirPath = path.join(this.settings.hexoRoot, "/source")
					
					const activeFile = that.app.workspace.getActiveFile();
					if (!activeFile) {
						return;
					}
					
					let absolutePath = decodeURI(that.app.vault.adapter.getResourcePath(activeFile.parent.path));
					absolutePath = absolutePath.substring(12)
					absolutePath = absolutePath.substring(0, absolutePath.lastIndexOf('?'))

					const originFilePath: string = path.join(absolutePath, "/img");
					
					fullBlog = processImages(fullBlog, title, originFilePath, imgDirPath)

					new Notice("正在发布博客: " + title)

					// generate blog file in hexo source dir
					writeFile(dirPath, fileName, fullBlog);

					// post blog to github page
					updateHexoPage(this.settings.hexoRoot)

					// upload blog file sources to github
					uploadBlogSource(this.settings.hexoRoot);
				}

				const content = editor.getValue();

				new BlogSettingModal(this.app, content, onSubmit).open();
			}
		})


		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

// modal to set blog setting
class BlogSettingModal extends Modal {
	title: string;		// blog title
	tag: string;		// blog tag
	category: string;	// blog category
	content: string;	// blog content
	onSubmit: (title: string, tag: string, category: string, content: string) => void;	// action when submit button clicked

	constructor(app: App, content: string, onSubmit: (title: string, tag: string, category: string, content: string) => void) {
		super(app);
		this.content = content;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const {contentEl} = this;

		contentEl.createEl("h1", {text: "博客设置"})

		// blog title
		new Setting(contentEl)
			.setName(BLOG_TITLE)
			.addText((text) => 
				text.onChange((value) => {
					this.title = value;
			}))

		// blog tag
		new Setting(contentEl)
			.setName(BLOG_TAG)
			.addText((text) => 
				text.onChange((value) => {
					this.tag = value;
			}));

		// blog category
		new Setting(contentEl)
			.setName(BLOG_CATEGORY)
			.addText((text) => 
				text.onChange((value) => {
					this.category = value;
			}));

		// blog post button
		new Setting(contentEl)
			.addButton((btn) => 
				btn
					.setButtonText(BLOG_POST_BLOG)
					.setCta()
					.onClick(() => {
						this.close();
						this.onSubmit(this.title, this.tag, this.category, this.content)
					}));
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for post blog to hexo.'});

		new Setting(containerEl)
			.setName('hexo root path')
			.setDesc('Your hexo directory root path')
			.addText(text => text
				.setPlaceholder('Enter your hexo path')
				.setValue(this.plugin.settings.hexoRoot)
				.onChange(async (value) => {
					console.log('hexo path: ' + value);
					this.plugin.settings.hexoRoot = value;
					await this.plugin.saveSettings();
				}));
	}
}
