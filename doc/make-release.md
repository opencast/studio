# How to cut a release for Opencast Studio

1. Switch to the commit you want to turn into the release
2. Create and push a new tag
   ```bash
    DATE=$(date +%Y-%m-%d)
    git tag -m Release -s "$DATE"
    git push upstream "$DATE":"$DATE"
   ```
3. Wait for the [Create release draft](https://github.com/opencast/studio/actions/workflows/create-release.yml)
   to finish
    - it will create a new [GitHub release draft](https://github.com/opencast/studio/releases)
    - review and publish the draft
4. Submit a pull request against Opencast
    - [Update the release](https://github.com/opencast/opencast/blob/develop/modules/studio/pom.xml#L16-L17)
    You have to change two lines:
      - `<opencast.studio.url>`: change the url to the new relase-url from `*-integrated.tar.gz`. (Usually only the date has to be adjusted here.)
      - `<opencast.studio.sha256>`: update the sha256 hash. (Run `sha256sum *-integrated.tar.gz` in Opencast Studio folder)
    - [Adjust the documentation](https://github.com/opencast/opencast/blob/develop/docs/guides/admin/docs/modules/studio.md)
      if necessary
    - [Update the configuration](https://github.com/opencast/opencast/blob/develop/etc/ui-config/mh_default_org/studio/settings.toml)
      if necessary
    - Verify that the new release runs in Opencast, then create the pull request.
