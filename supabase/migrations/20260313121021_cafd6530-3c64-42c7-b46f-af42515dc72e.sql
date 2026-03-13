-- Production hardening: increase statement timeout for client-facing roles
ALTER ROLE anon SET statement_timeout = '15s';
ALTER ROLE authenticated SET statement_timeout = '15s';
ALTER ROLE authenticator SET statement_timeout = '15s';