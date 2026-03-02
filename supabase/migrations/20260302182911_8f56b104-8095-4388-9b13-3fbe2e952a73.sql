INSERT INTO public.user_roles (user_id, tenant_id, role)
VALUES ('51f61846-006c-4543-b074-849186401183', '9f15242b-1d3f-4154-903c-514d736570a2', 'super_admin')
ON CONFLICT DO NOTHING;