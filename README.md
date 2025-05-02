# track fit
- https://fit.diginori.com

## Getting Started
First, run the development server:

```bash
npm run dev
```

## DB
```sql
CREATE TABLE IF NOT EXISTS weights (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    weight DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

## Dev
- https://fit-dev.vercel.app

### Ref
- [download svg icon](https://www.reshot.com/free-svg-icons/chart/)
- [favicon](https://favicon.io/)
