import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:web_socket_channel/web_socket_channel.dart';
import '../models/models.dart';

/// 백엔드 베이스 URL.
///
/// - Android 에뮬레이터: 호스트 PC는 10.0.2.2 로 접근
/// - iOS 시뮬레이터 / 웹 / 윈도우: localhost
///
/// 빌드 시 --dart-define=API_BASE=http://<your-ip>:8001 로 덮어쓸 수 있다.
const String _defaultBase = String.fromEnvironment(
  'API_BASE',
  defaultValue: 'http://localhost:8001',
);

class Api {
  static String get base => _defaultBase;
  static String get wsBase => base.replaceFirst(RegExp(r'^http'), 'ws');

  // ── Events ──────────────────────────────────────────────────────────────

  static Future<List<Event>> fetchEvents() async {
    final res = await http.get(Uri.parse('$base/api/v1/events/'));
    if (res.statusCode != 200) {
      throw Exception('Failed to fetch events: ${res.statusCode}');
    }
    final List<dynamic> data = jsonDecode(utf8.decode(res.bodyBytes));
    return data.map((e) => Event.fromJson(e as Map<String, dynamic>)).toList();
  }

  static Future<void> deleteEvent(String id) async {
    await http.delete(Uri.parse('$base/api/v1/events/$id'));
  }

  // ── Knowledge ────────────────────────────────────────────────────────────

  static Future<void> addKnowledge(String content,
      {List<String> tags = const []}) async {
    await http.post(
      Uri.parse('$base/api/v1/knowledge/'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'content': content, 'source': 'manual', 'tags': tags}),
    );
  }

  // ── Chat (SSE over HTTP streaming) ─────────────────────────────────────────

  /// 채팅 응답을 토큰 단위로 스트리밍한다.
  static Stream<String> streamChat(String message, String sessionId) async* {
    final req = http.Request('POST', Uri.parse('$base/api/v1/chat/'));
    req.headers['Content-Type'] = 'application/json';
    req.body = jsonEncode({'message': message, 'session_id': sessionId});

    final res = await http.Client().send(req);
    final lines = res.stream
        .transform(utf8.decoder)
        .transform(const LineSplitter());

    await for (final line in lines) {
      if (!line.startsWith('data:')) continue;
      final raw = line.substring(5).trim();
      if (raw == '[DONE]') return;
      try {
        final data = jsonDecode(raw);
        if (data['delta'] != null) yield data['delta'] as String;
      } catch (_) {}
    }
  }

  // ── WebSocket (실시간 일정 동기화) ────────────────────────────────────────

  static WebSocketChannel connectCalendar(String sessionId) {
    return WebSocketChannel.connect(Uri.parse('$wsBase/ws/$sessionId'));
  }
}
