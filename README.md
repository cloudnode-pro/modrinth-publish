# modrinth-publish

Publish a version on Modrinth. Works for all Modrinth project types.

## Usage

```yaml
# …
steps:
  - uses: cloudnode-pro/modrinth-publish@2.0.0
    with:
      token: ${{ secrets.MODRINTH_TOKEN }}
      # … configure the action using inputs here
```

## Inputs

### `api-domain`

Modrinth API domain. For testing purposes you can set this to `staging-api.modrinth.com`.
See [Modrinth Staging Server](https://staging.modrinth.com).

<dl>
    <dt>Default</dt>
    <dd><code>api.modrinth.com</code></dd>
</dl>

***

### `token` (required)

Modrinth API token. The token must have the ‘Create versions’ scope. This token is secret, and it’s recommended to set
it inside
a [GitHub Repository Secret](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions).

Personal access tokens (PATs) can be generated from [the user settings](https://modrinth.com/settings/pats).

***

### `project` (required)

The ID of the project this version is for.

You can obtain the ID by opening your project on Modrinth, then opening the <kbd>⋮</kbd> menu, and selecting <kbd>Copy
ID</kbd>.

***

### `name`

The name of this version.

<dl>
    <dt>Default</dt>
    <dd>copied from <code>version</code></dd>
</dl>

***

### `version` (required)

The version number. Ideally will follow [semantic versioning](https://semver.org/).

***

### `channel`

The release channel for this version.

<dl>
    <dt>Allowed values</dt>
    <dd><code>release</code>, <code>beta</code>, <code>alpha</code></dd>
    <dt>Default</dt>
    <dd>Inferred from the version.
    <ul>
        <li>If version includes <code>alpha</code>, will be set to <code>alpha</code>.</li>
        <li>If version includes <code>beta</code>, <code>rc</code>, or <code>pre</code>, will be set to <code>beta</code>.</li>
        <li>Otherwise, will be set to <code>release</code>.</li>
    </ul>
    </dd>
</dl>

***

### `featured`

Whether the version is featured or not.

<dl>
    <dt>Allowed values</dt>
    <dd><code>true</code>, <code>false</code></dd>
    <dt>Default</dt>
    <dd><code>true</code> if the release channel is <code>release</code>, otherwise <code>false</code>.</dd>
</dl>

***

### `changelog`

The changelog for this version.

***

### `loaders` (required)

The mod loaders that this version supports. In case of resource packs, use `minecraft`.

Format each loader on a new line, or use a JSON string array.

<dl>
    <dt>Example</dt>
    <dd>

```yaml
loaders: |-
  paper
  fabric
```

```yaml
loaders: '["paper", "fabric"]'
```

</dd>
</dl>

***

### `game-versions`

A list of versions of Minecraft that this version supports. You can use a pattern like `1.21.x` to include all patch
versions (the last number in the version).

Format each version on a new line, or use a JSON string array.

<dl>
    <dt>Example</dt>
    <dd>

```yaml
game-versions: |-
  1.21.x
  1.20.x
  1.19.4
```

```yaml
game-versions: '["1.21.x", "1.20.x", "1.19.4"]'
```

</dd>
</dl>

***

### `files` (required)

A list of file paths to upload. There must be at least one file, unless the new version’s status is `draft`. The allowed
file extensions are `.mrpack`, `.jar`, `.zip`, and `.litemod`.

Format each file on a new line, or use a JSON string array.

<dl>
    <dt>Example</dt>
    <dd>

```yaml
files: |-
  target/YourProject-1.2.3.jar
  path/to/file.zip
```

```yaml
files: '["target/YourProject-1.2.3.jar", "path/to/file.zip"]'
```

</dd>
</dl>

***

### `primary-file`

The name (not path) from `files` to be set as the primary file.

<dl>
    <dt>Example</dt>
    <dd><code>YourProject-1.2.3.jar</code></dd>
</dl>

***

### `dependencies`

A list of specific versions of projects that this version depends on.

Formatted as JSON array.
See [Create Version - Modrinth API docs](https://docs.modrinth.com/api/operations/createversion/#request-body).

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

<dl>
    <dt>Allowed values</dt>
    <dd><code>listed</code>, <code>archived</code>, <code>draft</code>, <code>unlisted</code>, <code>scheduled</code>, <code>unknown</code></dd>
    <dt>Default</dt>
    <dd><code>listed</code></dd>
</dl>

***

### `requested-status`

<dl>
    <dt>Allowed values</dt>
    <dd><code>listed</code>, <code>archived</code>, <code>draft</code>, <code>unlisted</code></dd>
</dl>

***

## Example Maven workflow

You can use the following example workflow to publish a version on Modrinth by creating a release on GitHub.

This example workflow will let you automatically build and upload a version on Modrinth whenever you publish a new
release via GitHub. This enables you to choose the version tag and write release notes via the GitHub interface.

As the version will be taken from the release tag, in your `pom.xml` you can set a version like `0.0.0-SNAPSHOT` and it
will always be replaced with the correct version for builds via the workflow. This means you won‘t need to update the
version in multiple places.

<details name="example-workflow" open>
<summary>Maven</summary>

```yaml
name: Publish

on:
  release:
    types: [published]

jobs:
  publish:
    name: Publish
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      # !!! Make sure to select the correct Java version for your project !!!
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: 17
          distribution: temurin
          cache: maven

      # This step will take the version tag from the release and replace it in `pom.xml` before building.
      - name: Set version from release tag
        run: mvn -B versions:set -DnewVersion=${{ github.event.release.tag_name }} -DgenerateBackupPoms=false

      - name: Build and package with Maven
        run: mvn -B clean package --file pom.xml

      - name: Upload to Modrinth
        uses: cloudnode-pro/modrinth-publish@2.0.0
        with:
          # Configure the action as needed. The following is an example.
          token: ${{ secrets.MODRINTH_TOKEN }}
          project: AABBCCDD
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
