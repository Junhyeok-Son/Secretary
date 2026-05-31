import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../models/models.dart';
import '../services/api.dart';

class CalendarScreen extends StatefulWidget {
  final String sessionId;
  const CalendarScreen({super.key, required this.sessionId});

  @override
  State<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  List<Event> _events = [];
  bool _loading = true;
  WebSocketChannel? _ws;

  @override
  void initState() {
    super.initState();
    _load();
    _connectWs();
  }

  @override
  void dispose() {
    _ws?.sink.close();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final events = await Api.fetchEvents();
      setState(() => _events = events);
    } catch (_) {
      // 무시 — 서버 미연결 시 빈 목록 유지
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _connectWs() {
    try {
      _ws = Api.connectCalendar(widget.sessionId);
      _ws!.stream.listen((raw) {
        try {
          final msg = jsonDecode(raw as String);
          final type = msg['type'];
          if (type == 'event_created') {
            setState(() {
              _events.add(Event.fromJson(msg['data']));
              _events.sort((a, b) => a.startAt.compareTo(b.startAt));
            });
          } else if (type == 'event_deleted') {
            setState(() =>
                _events.removeWhere((e) => e.id == msg['data']['id']));
          } else if (type == 'event_updated') {
            final updated = Event.fromJson(msg['data']);
            setState(() {
              final i = _events.indexWhere((e) => e.id == updated.id);
              if (i >= 0) _events[i] = updated;
            });
          }
        } catch (_) {}
      }, onError: (_) {});
    } catch (_) {}
  }

  Future<void> _delete(Event event) async {
    await Api.deleteEvent(event.id);
    setState(() => _events.removeWhere((e) => e.id == event.id));
  }

  String _dateLabel(DateTime d) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final target = DateTime(d.year, d.month, d.day);
    final diff = target.difference(today).inDays;
    if (diff == 0) return '오늘';
    if (diff == 1) return '내일';
    return DateFormat('M월 d일 (E)', 'ko').format(d);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return RefreshIndicator(
      onRefresh: _load,
      child: _loading
          ? const Center(child: CircularProgressIndicator())
          : _events.isEmpty
              ? ListView(
                  children: [
                    SizedBox(
                      height: MediaQuery.of(context).size.height * 0.6,
                      child: Center(
                        child: Text('등록된 일정이 없어요',
                            style:
                                TextStyle(color: theme.colorScheme.outline)),
                      ),
                    ),
                  ],
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(12),
                  itemCount: _events.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, i) {
                    final ev = _events[i];
                    final past = ev.endAt.isBefore(DateTime.now());
                    return Dismissible(
                      key: Key(ev.id),
                      direction: DismissDirection.endToStart,
                      background: Container(
                        alignment: Alignment.centerRight,
                        padding: const EdgeInsets.only(right: 20),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.errorContainer,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(Icons.delete,
                            color: theme.colorScheme.onErrorContainer),
                      ),
                      onDismissed: (_) => _delete(ev),
                      child: Opacity(
                        opacity: past ? 0.5 : 1,
                        child: Card(
                          margin: EdgeInsets.zero,
                          child: ListTile(
                            title: Text(ev.title,
                                style: const TextStyle(
                                    fontWeight: FontWeight.w600)),
                            subtitle: Text(
                              '${_dateLabel(ev.startAt)} · '
                              '${DateFormat('HH:mm').format(ev.startAt)} ~ '
                              '${DateFormat('HH:mm').format(ev.endAt)}'
                              '${ev.location != null ? '\n${ev.location}' : ''}',
                            ),
                            isThreeLine: ev.location != null,
                            trailing: _dateLabel(ev.startAt) == '오늘'
                                ? Chip(
                                    label: const Text('오늘',
                                        style: TextStyle(fontSize: 11)),
                                    visualDensity: VisualDensity.compact,
                                    padding: EdgeInsets.zero,
                                  )
                                : null,
                          ),
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
