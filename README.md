# ![](data/menu-icon-256.png)
## lgtm for firfox [![Code Climate](https://codeclimate.com/github/kumabook/lgtm-for-firefox/badges/gpa.svg)](https://codeclimate.com/github/kumabook/lgtm-for-firefox)

This is firefox addon for lgtm.in.
You can spice up your LGTM comment.

This addon is inspired by Chrome extension [LGTM](https://github.com/monochromegane/LGTM)
## How to use

1. Click "Good" icon
2. Show panel that has LGTM images in lgtm.in/g.
3. A image is selected, copy the markdown text to clipboard. And if github pull request page is opened,
input it to the textarea.
4. If you don't like any images, please reopen the panel.

## How to build

```
   $ git submodule init
   $ git submodule update
   $ addon-sdk/bin/cfx xpi
```

## Special Thanks:
- [LGTM.in/g](http://www.lgtm.in/)
- Chrome extension [LGTM](https://github.com/monochromegane/LGTM)

