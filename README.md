# modrinth-publish
A GitHub workflow for publishing plugin versions to Modrinth

> [!NOTE]
> This workflow only works for GitHub release events and only for plugins.
 
## Basic Usage
Make sure that you run your GitHub action with:
```yaml
on:
    release:
        types: [ published ]
```

If the event is not `release`, this workflow will be skipped.

Add the following step to your workflow:
```yaml
- name: Upload to Modrinth
  uses: cloudnode-pro/modrinth-publish@1.0.0
  with:
    token: ${{ secrets.MODRINTH_TOKEN }}
    project: AABBCCDD
    file: target/ProjectName-${{ github.event.release.tag_name }}.jar
    changelog: ${{ github.event.release.body }}
    loaders: paper, spigot
    api-domain: api.modrinth.com
```

Create a `MODRINTH_TOKEN` secret in your repository containing a Modrinth PAT (API token) with the "Create versions" permission. Replace the rest of the inputs with the desired values.

> [!NOTE]
> This GitHub Action **will not** increment your project version or build/package your `.jar`. To do that, you will need to add additional steps to your workflow.

### Example Maven Release Workflow
```yaml
name: Maven Release
'on':
  release:
    types: [ published ]
jobs:
  publish:
    name: Build and Upload JARs
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      - name: Set up Java
        uses: actions/setup-java@v3
        with:
          java-version: '17' # Make sure to set the correct Java version for your project
          distribution: temurin
      
      # This step changes the version in your pom.xml to match the release tag
      # This change only happens in the workflow and is not committed to your repository.
      # You could set the version in your repository to something like `0.0.0-SNAPSHOT` and
      # it will always be overwritten to the correct version here when a release is created.
      - name: Set maven project ver
        run: mvn -B versions:set -DnewVersion=${{ github.event.release.tag_name }} -DgenerateBackupPoms=false
      
      # This step compiles your Maven project to a `.jar`
      - name: Build and package Maven project
        run: mvn clean package
        
      # An optional step to also upload the `.jar` to the GitHub release assets
      - name: Upload to release
        uses: JasonEtco/upload-to-release@master
        with:
          # Make sure that this matches the file name of your .jar
          args: target/YourPlugin-${{ github.event.release.tag_name }}.jar application/java-archive
        env:
          GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}'
      
      # Upload the .jar to Modrinth
      - name: Upload to Modrinth
        uses: cloudnode-pro/modrinth-publish@1.0.0
        with:
          token: '${{ secrets.MODRINTH_TOKEN }}' # You need to create this secret in your repository settings
          project: AABBCCDD # Replace with your project id/slug
          file: 'target/YourPlugin-${{ github.event.release.tag_name }}.jar' # Make sure that this matches the file name of your .jar
          changelog: '${{ github.event.release.body }}' # Copies the version changelog from the GitHub release notes
          loaders: 'paper, spigot' # A list of your supported loaders

```

## Input Options
| Parameter      | Required | Description                                                                                                                                                                            |
|----------------|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `token`        | yes      | Modrinth API token                                                                                                                                                                     |
| `project`      | yes      | Modrinth project ID                                                                                                                                                                    |
| `file`         | yes      | Path to file to upload                                                                                                                                                                 |
| `changelog`    | no       | The changelog for this version (markdown). Defaults to GitHub release notes.                                                                                                           |
| `loaders`      | yes      | The mod loaders that this version supports (separated by commas or as JSON string array). See [createVersion](https://docs.modrinth.com/api-spec#tag/versions/operation/createVersion) |
| `dependencies` | no       | A list of specific versions of projects that this version depends on (as JSON array). See [createVersion](https://docs.modrinth.com/api-spec#tag/versions/operation/createVersion)     |
| `api-domain`   | no       | Modrinth API domain. For testing purposes you can set this to `staging-api.modrinth.com`. See [Modrinth Staging Server](https://staging.modrinth.com)                                  |                                  |
