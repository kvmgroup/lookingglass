# lookingglass
Looking glass for AS211350

# install
Run behind a reverse proxy like Nginx or HAProxy. To run you should use a tool like `pm2` or create a systemd service. In order to prevent direct (unprotected) connections to the application you should block all external traffic from reaching the port like so:

```
# Allow localhost access to port 2750
iptables -A INPUT -p tcp --dport 2750 -s 127.0.0.0/8 -j ACCEPT
ip6tables -A INPUT -p tcp --dport 2750 -s 127.0.0.0/8 -j ACCEPT

# Drop outside access to port 2750
iptables -A INPUT -p tcp --dport 2750 -j DROP
ip6tables -A INPUT -p tcp --dport 2750 -j DROP

# Save iptables
iptables-save
ip6tables-save
```

# security issues

Please send us any security issues first via email at `kjartan [ätt] kvm [döt] group`. We ask you to report to us privately in the interest of fixing the security vulnerability before putting active instalations at risk.
