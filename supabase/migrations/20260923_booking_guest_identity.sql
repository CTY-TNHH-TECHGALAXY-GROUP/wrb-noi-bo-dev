-- Check legacy collisions before applying; this migration does not rewrite customer links.
-- SELECT "phone", count(*) FROM public."Customers"
-- WHERE "phone" LIKE 'GUEST-%' GROUP BY "phone" HAVING count(*) > 1;
-- SELECT "id", count(*) FROM public."Bookings" GROUP BY "id" HAVING count(*) > 1;

DO $$
DECLARE phone_limit integer;
BEGIN
    SELECT character_maximum_length INTO phone_limit
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Customers' AND column_name = 'phone';
    IF NOT FOUND THEN RAISE EXCEPTION 'Customers.phone is missing'; END IF;
    IF phone_limit IS NOT NULL AND phone_limit < 64 THEN
        RAISE EXCEPTION 'Customers.phone must allow at least 64 characters for GUEST-<bookingId>';
    END IF;
    IF NOT EXISTS (
        SELECT 1
        FROM pg_index i
        JOIN pg_class t ON t.oid = i.indrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attname = 'id'
        WHERE n.nspname = 'public' AND t.relname = 'Bookings'
          AND i.indisunique AND i.indnkeyatts = 1 AND i.indkey[0] = a.attnum
    ) THEN
        CREATE UNIQUE INDEX bookings_id_unique_guest_guard ON public."Bookings" ("id");
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS customers_guest_phone_unique_guard
    ON public."Customers" ("phone") WHERE "phone" LIKE 'GUEST-%';
