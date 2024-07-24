# Welcome to Remix!

- 📖 [Remix docs](https://remix.run/docs)

## Development

Run the dev server:

```shellscript
npm run dev
```

## Deployment

First, build your app for production:

```sh
npm run build
```

Then run the app in production mode:

```sh
npm start
```

Now you'll need to pick a host to deploy it to.

### DIY

If you're familiar with deploying Node applications, the built-in Remix app server is production-ready.

Make sure to deploy the output of `npm run build`

- `build/server`
- `build/client`

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever css framework you prefer. See the [Vite docs on css](https://vitejs.dev/guide/features.html#css) for more information.

## .env

```env
DATABASE_URL="..."
SESSION_SECRET="..."
```

## Database

```sh
yarn prisma db push
```
```sh
yarn prisma db seed
```

# TODO

- [ ] ~~verificar por que as vezes o fetcher não revalida as rotas~~
- [X] loading no botão de salvar registro (Não dá pra saber o form)
- [X] Receber produtos tá mundando o valor pro original quando clica no botão
- [X] adicionar timestamp com time zone nas datas
- [ ] id auto_increment?
- [X] adicionar validações melhores (cpf já existe, ...)
- [X] ErrorBoundary
- [ ] melhorar search (q) fornecedor, produto e cliente