module.exports = {
    apps: [
        {
            name: 'ceoboard',
            script: 'dist/index.js',
            interpreter: 'bun',
            instances: 1,
            autorestart: true,
            watch: false,
            env_file: '.env',
            env: {
                NODE_ENV: 'production',
            },
        },
    ],
}
