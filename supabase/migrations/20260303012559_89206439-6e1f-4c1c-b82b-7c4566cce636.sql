-- Enable realtime for webhook_logs so TopBar can receive live notifications
ALTER PUBLICATION supabase_realtime ADD TABLE webhook_logs;