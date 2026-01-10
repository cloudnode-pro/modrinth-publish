# modrinth-publish

A GitHub Action for publishing versions on Modrinth.

## Quick Start

```yaml
- uses: cloudnode-pro/modrinth-publish@v2
  with:
    token: ${{ secrets.MODRINTH_TOKEN }}
    project: AABBCCDD
    version: 1.2.3
    loaders: fabric
    game-versions: 1.21.11
    files: target/Project-1.2.3.jar
```

## Inputs

### `token` (required)

A personal access token for the Modrinth API with *Create versions* scope. It’s strongly recommended to store this in
a [GitHub Repository Secret](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions).

Personal access tokens (PATs) can be generated from [the user settings](https://modrinth.com/settings/pats).

***

### `project` (required)

The Modrinth project ID that the version belongs to.

This can be copied from the project’s page via the ‘more options’ menu <kbd>⋮</kbd> → <kbd>Copy ID</kbd>.

***

### `version` (required)

The version number, ideally following [semantic versioning](https://semver.org/).

***

### `loaders` (required)

List of supported loaders for this version.

Format each loader on a new line or use a JSON string array.

<dl>
    <dt>Example</dt>
    <dd>

```yaml
loaders: fabric
```

```yaml
loaders: |-
  paper
  spigot
  bukkit
```

```yaml
loaders: '["paper", "spigot", "bukkit"]'
```

</dd>
</dl>

<details>
<summary>All loaders</summary>

<table>
  <thead>
    <tr>
      <th>Loader</th>
      <th>ID</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th colspan="2">Mods</th>
    </tr>
    <tr>
      <td>Babric</td>
      <td><code>babric</code></td>
    </tr>
    <tr>
      <td>BTA (Babric)</td>
      <td><code>bta-babric</code></td>
    </tr>
    <tr>
      <td>Fabric</td>
      <td><code>fabric</code></td>
    </tr>
    <tr>
      <td>Forge</td>
      <td><code>forge</code></td>
    </tr>
    <tr>
      <td>Java Agent</td>
      <td><code>java-agent</code></td>
    </tr>
    <tr>
      <td>Legacy Fabric</td>
      <td><code>legacy-fabric</code></td>
    </tr>
    <tr>
      <td>LiteLoader</td>
      <td><code>liteloader</code></td>
    </tr>
    <tr>
      <td>Risugami’s ModLoader</td>
      <td><code>modloader</code></td>
    </tr>
    <tr>
      <td>NeoForge</td>
      <td><code>neoforge</code></td>
    </tr>
    <tr>
      <td>NilLoader</td>
      <td><code>nilloader</code></td>
    </tr>
    <tr>
      <td>Ornithe</td>
      <td><code>ornithe</code></td>
    </tr>
    <tr>
      <td>Quilt</td>
      <td><code>quilt</code></td>
    </tr>
    <tr>
      <td>Rift</td>
      <td><code>rift</code></td>
    </tr>
    <tr>
      <th colspan="2">Plugins</th>
    </tr>
    <tr>
      <td>Bukkit</td>
      <td><code>bukkit</code></td>
    </tr>
    <tr>
      <td>BungeeCord</td>
      <td><code>bungeecord</code></td>
    </tr>
    <tr>
      <td>Folia</td>
      <td><code>folia</code></td>
    </tr>
    <tr>
      <td>Geyser</td>
      <td><code>geyser</code></td>
    </tr>
    <tr>
      <td>Paper</td>
      <td><code>paper</code></td>
    </tr>
    <tr>
      <td>Purpur</td>
      <td><code>purpur</code></td>
    </tr>
    <tr>
      <td>Spigot</td>
      <td><code>spigot</code></td>
    </tr>
    <tr>
      <td>Sponge</td>
      <td><code>sponge</code></td>
    </tr>
    <tr>
      <td>Velocity</td>
      <td><code>velocity</code></td>
    </tr>
    <tr>
      <td>Waterfall</td>
      <td><code>waterfall</code></td>
    </tr>
    <tr>
      <th colspan="2">Resource Packs</th>
    </tr>
    <tr>
      <td>Minecraft</td>
      <td><code>minecraft</code></td>
    </tr>
    <tr>
      <th colspan="2">Shaders</th>
    </tr>
    <tr>
      <td>Canvas</td>
      <td><code>canvas</code></td>
    </tr>
    <tr>
      <td>Iris</td>
      <td><code>iris</code></td>
    </tr>
    <tr>
      <td>OptiFine</td>
      <td><code>optifine</code></td>
    </tr>
    <tr>
      <td>Vanilla</td>
      <td><code>vanilla</code></td>
    </tr>
    <tr>
      <th colspan="2">Data Packs</th>
    </tr>
    <tr>
      <td>Data Pack</td>
      <td><code>datapack</code></td>
    </tr>
  </tbody>
</table>

</details>

***

### `game-versions` (required)

List of supported Minecraft versions. You can use patterns like `1.21.x` and `26.1.x`.

Format each version on a new line or use a JSON string array.

<dl>
    <dt>Example</dt>
    <dd>

```yaml
game-versions: 1.21.x
```

```yaml
game-versions: |-
  1.19.4
  1.20.x
  25w45a
  1.21.x
  26.1-snapshot-1
```

```yaml
game-versions: '["1.19.4", "1.20.x", "25w45a", "1.21.x", "26.1-snapshot-1"]'
```

</dd>
</dl>

***

### `files` (required unless draft)

One or more file paths or HTTP URLs to upload. This input is optional when the [`status`](#status) is `draft`.

The allowed file extensions are `.mrpack`, `.jar`, `.zip`, `.litemod`, `.asc`, `.gpg`, and `.sig`.

> [!NOTE]
> Supplementary files are for supporting resources like source code and documentation, not for alternative versions or
> variants.

> [!NOTE]
> If you specify an HTTP URL, the action downloads the file during workflow execution and uploads it to Modrinth as a
> regular static file. Users downloading the version will get the file from Modrinth, not from the URL.

Format each file on a new line or use a JSON string array.

<dl>
    <dt>Example</dt>
    <dd>

```yaml
files: target/YourProject-1.2.3.jar
```

```yaml
files: |-
  target/YourProject-1.2.3.jar
  path/to/file.zip
  https://example.com/file.zip
```

```yaml
files: '["target/YourProject-1.2.3.jar", "path/to/file.zip", "https://example.com/file.zip"]'
```

</dd>
</dl>

***

### `primary-file`

The name (not path) of the file from [`files`](#files-required-unless-draft) to designate as primary. If you used HTTP
URLs, the name is considered the last path component, e.g. `name` in `https://example.com/foo/name`.

<dl>
    <dt>Example</dt>
    <dd><code>YourProject-1.2.3.jar</code></dd>
</dl>

***

### `name`

The name of this version.

The Modrinth UI usually names versions ‘YourProject 1.2.3’. You can use the version name to provide a very brief summary
of the version/changelog.

<dl>
    <dt>Default</dt>
    <dd>copied from <a href="#version-required"><code>version</code></a></dd>
</dl>

***

### `channel`

The release channel for this version.

<dl>
    <dt>Release</dt>
    <dd>Final, stable version.</dd>
    <dt>Beta</dt>
    <dd>Feature-complete testing version.</dd>
    <dt>Alpha</dt>
    <dd>Early, unstable development version.</dd>
</dl>

<dl>
    <dt>Allowed values</dt>
    <dd><code>release</code>, <code>beta</code>, <code>alpha</code></dd>
    <dt>Default</dt>
    <dd>Inferred from the <a href="#version-required"><code>version</code></a>:
    <ul>
        <li>If version includes <code>alpha</code>, will be set to <code>alpha</code>.</li>
        <li>If version includes <code>beta</code>, <code>rc</code>, or <code>pre</code>, will be set to <code>beta</code>.</li>
        <li>Otherwise, will be set to <code>release</code>.</li>
    </ul>
    </dd>
</dl>

***

### `changelog`

Text describing the changes in this version. You can
use [Markdown formatting](https://support.modrinth.com/articles/8801962).

<dl>
    <dt>Default</dt>
    <dd><i>empty</i></dd>
</dl>

***

### `dependencies`

List of dependencies for this version.

Formatted as a JSON array of objects with the following properties:

<dl>
    <dt><code>dependency_type</code> (required)</dt>
    <dd>The type of the dependency. Possible values: <code>required</code>, <code>optional</code>,
        <code>incompatible</code>, <code>embedded</code>.</dd>
    <dt><code>project_id</code></dt>
    <dd>The ID of a Modrinth project. Exclusive with <code>file_name</code>.</dd>
    <dt><code>version_id</code></dt>
    <dd>The ID of the specific dependency version. If not specified, means <i>any</i> version of the
        <code>project_id</code>. Exclusive with <code>file_name</code>.</dd>
    <dt><code>file_name</code></dt>
    <dd>The name of a file relating to an external (non-Modrinth) dependency. Exclusive with <code>project_id</code>
        and <code>version_id</code>.</dd>
</dl>

<details>
<summary>Dependency types</summary>

<dl>
    <dt>Required</dt>
    <dd>The dependency is strictly required for this version to work correctly.</dd>
    <dt>Optional</dt>
    <dd>The dependency is used if present, but is not mandatory.</dd>
    <dt>Incompatible</dt>
    <dd>The dependency causes conflict and cannot coexist with this version.</dd>
    <dt>Embedded</dt>
    <dd>The dependency is bundled within the primary file of this version.</dd>
</dl>
</details>

<dl>
    <dt>Example</dt>
    <dd>

```yaml
dependencies: |-
  [{
      "project_id": "AABBCCDD",
      "dependency_type": "optional"
  }]
```

</dd>
</dl>

***

### `status`

The status of the version.

<details>
<summary>Status descriptions</summary>
<dl>
    <dt>Listed (default)</dt>
    <dd>Public and visible to anyone.</dd>
    <dt>Archived</dt>
    <dd>Identical to <code>listed</code> but shows a message that the version is not supported.</dd>
    <dt>Draft</dt>
    <dd>Not public and can only be accessed by project members.</dd>
    <dt>Unlisted</dt>
    <dd>Not shown in the project’s versions list, but can be publicly accessed via direct URL.</dd>
    <dt>Scheduled</dt>
    <dd>Not public, but scheduled to be released in the future.</dd>
</dl>
</details>

<dl>
    <dt>Allowed values</dt>
    <dd><code>listed</code>, <code>archived</code>, <code>draft</code>, <code>unlisted</code>, <code>scheduled</code></dd>
    <dt>Default</dt>
    <dd><code>listed</code></dd>
</dl>

***

<details>
<summary>Deprecated inputs</summary>

### ~~`api-domain`~~ (deprecated)

The Modrinth API domain.

> [!WARNING]
> The Modrinth Staging API is no longer recommended for testing or as a sandbox. Instead, consider creating a ‘draft’
> project on the production API and deleting it after testing.
> This input is scheduled for removal in `v3.0.0`.

<dl>
    <dt>Default</dt>
    <dd><code>api.modrinth.com</code></dd>
</dl>

***

### ~~`featured`~~ (deprecated)

Whether the version is featured or not.

> [!WARNING]
> Modrinth has deprecated featured versions and ignores this option. This input is scheduled for removal in `v3.0.0`.

<dl>
    <dt>Allowed values</dt>
    <dd><code>true</code>, <code>false</code></dd>
    <dt>Default</dt>
    <dd><code>true</code> if the release channel is <code>release</code>, otherwise <code>false</code>.</dd>
</dl>

***

### ~~`requested-status`~~ (deprecated)

> [!WARNING]
> Modrinth has deprecated this option and ignores it. This input is scheduled for removal in `v3.0.0`.

<dl>
    <dt>Allowed values</dt>
    <dd><code>listed</code>, <code>archived</code>, <code>draft</code>, <code>unlisted</code></dd>
</dl>

</details>

***

## Example Maven workflow

You can use the following example workflow to publish a version on Modrinth by creating a release on GitHub.

This example workflow will let you automatically build and upload a version on Modrinth whenever you publish a new
release via GitHub. This enables you to choose the version tag and write release notes via the GitHub interface.

As the version will be taken from the release tag, in your `pom.xml` you can set a version like `0.0.0-SNAPSHOT` and it
will always be replaced with the correct version for builds via the workflow. This means you won‘t need to update the
version in multiple places.

<details name="example-workflow" open>
<summary>Maven workflow</summary>

```yaml
name: Publish

on:
  release:
    types: [ published ]

jobs:
  publish:
    name: Publish
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up JDK
        uses: actions/setup-java@v4
        with:
          # !!! Select the correct Java version for your project !!!
          java-version: 17
          distribution: temurin
          cache: maven

      # Takes the version tag from the release and replaces it temporarily
      # in `pom.xml` before building.
      - name: Set version from release tag
        run: mvn -B versions:set -DnewVersion=${{ github.event.release.tag_name }} -DgenerateBackupPoms=false

      - name: Build and package with Maven
        run: mvn -B clean package --file pom.xml

      - name: Upload to Modrinth
        uses: cloudnode-pro/modrinth-publish@v2
        with:
          # Configure the action as needed. The following is an example.
          token: ${{ secrets.MODRINTH_TOKEN }}
          project: ${{ vars.MODRINTH_ID }}
          name: ${{ github.event.release.name }}
          version: ${{ github.event.release.tag_name }}
          changelog: ${{ github.event.release.body }}
          loaders: |-
            paper
            spigot
            bukkit
          game-versions: |-
            1.20.x
            1.21.x
          files: target/YourProject-${{ github.event.release.tag_name }}.jar
```

</details>
