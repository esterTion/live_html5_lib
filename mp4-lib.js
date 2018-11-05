'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * MP4 Parser
 * @author esterTion
 * https://github.com/esterTion/flv.js/blob/master/src/demux/mp4-demuxer.js
 * 
 */
function ReadBig16(array, index) {
  return array[index] << 8 | array[index + 1];
}
function ReadBig32(array, index) {
  return ReadBig16(array, index) * 65536 + ReadBig16(array, index + 2);
}
function ReadBig64(array, index) {
  return ReadBig32(array, index) * 4294967296 + ReadBig32(array, index + 4);
}
function ReadString(uintarray, index, length) {
  var arr = [];
  for (var i = 0; i < length; i++) {
    arr.push(uintarray[index + i]);
  }
  try {
    return decodeURIComponent(escape(String.fromCharCode.apply(null, arr)));
  } catch (e) {
    return '';
  }
}
var esdsIDs = {
  3: 'esDescription',
  4: 'decConfigDescription',
  5: 'decSpecificDescription'
};
function esdsParse(parent, array, index) {
  var descType = array[index];
  var offset = 1;
  var size = 0;
  var byteRead = array[index + offset];
  while (byteRead & 0x80) {
    size = (byteRead & 0x7f) << 7;
    offset++;
    byteRead = array[index + offset];
  }
  size += byteRead & 0x7f;
  offset++;
  switch (descType) {
    case 3:
      {
        //esDesc
        var trackID = ReadBig16(array, index + offset);
        var flags = array[index + offset + 2];
        offset += 3;
        parent[esdsIDs[descType]] = {
          size: size,
          trackID: trackID
        };
        esdsParse(parent[esdsIDs[descType]], array, index + offset);
        break;
      }
    case 4:
      {
        //decConfig
        var oti = array[index + offset];
        var streamType = array[index + offset + 1];
        var bufferSize = ReadBig32(array, index + offset + 1) & 0xffffff;
        var maxBitrate = ReadBig32(array, index + offset + 5);
        var avgBitrate = ReadBig32(array, index + offset + 9);
        parent[esdsIDs[descType]] = {
          oti: oti,
          streamType: streamType,
          bufferSize: bufferSize,
          maxBitrate: maxBitrate,
          avgBitrate: avgBitrate
        };
        esdsParse(parent[esdsIDs[descType]], array, index + offset + 13);
        break;
      }
    case 5:
      {
        //decSpecfic
        var data = Array.from(new Uint8Array(array.buffer, array.byteOffset + index + offset, size));
        var originalAudioObjectType = data[0] >>> 3;
        var samplingIndex = (data[0] & 0x07) << 1 | data[1] >>> 7;
        var channelConfig = (data[1] & 0x78) >>> 3;
        parent[esdsIDs[descType]] = {
          data: data,
          originalAudioObjectType: originalAudioObjectType,
          samplingIndex: samplingIndex,
          channelConfig: channelConfig
        };
        break;
      }
  }
}

var SPSParser = function () {
  function SPSParser() {
    _classCallCheck(this, SPSParser);
  }

  _createClass(SPSParser, null, [{
    key: '_ebsp2rbsp',
    value: function _ebsp2rbsp(uint8array) {
      var src = uint8array;
      var src_length = src.byteLength;
      var dst = new Uint8Array(src_length);
      var dst_idx = 0;

      for (var i = 0; i < src_length; i++) {
        if (i >= 2) {
          // Unescape: Skip 0x03 after 00 00
          if (src[i] === 0x03 && src[i - 1] === 0x00 && src[i - 2] === 0x00) {
            continue;
          }
        }
        dst[dst_idx] = src[i];
        dst_idx++;
      }

      return new Uint8Array(dst.buffer, 0, dst_idx);
    }
  }, {
    key: 'parseSPS',
    value: function parseSPS(uint8array) {
      var rbsp = SPSParser._ebsp2rbsp(uint8array);
      var gb = new ExpGolomb(rbsp);

      gb.readByte();
      var profile_idc = gb.readByte(); // profile_idc
      gb.readByte(); // constraint_set_flags[5] + reserved_zero[3]
      var level_idc = gb.readByte(); // level_idc
      gb.readUEG(); // seq_parameter_set_id

      var profile_string = SPSParser.getProfileString(profile_idc);
      var level_string = SPSParser.getLevelString(level_idc);
      var chroma_format_idc = 1;
      var chroma_format = 420;
      var chroma_format_table = [0, 420, 422, 444];
      var bit_depth = 8;

      if (profile_idc === 100 || profile_idc === 110 || profile_idc === 122 || profile_idc === 244 || profile_idc === 44 || profile_idc === 83 || profile_idc === 86 || profile_idc === 118 || profile_idc === 128 || profile_idc === 138 || profile_idc === 144) {

        chroma_format_idc = gb.readUEG();
        if (chroma_format_idc === 3) {
          gb.readBits(1); // separate_colour_plane_flag
        }
        if (chroma_format_idc <= 3) {
          chroma_format = chroma_format_table[chroma_format_idc];
        }

        bit_depth = gb.readUEG() + 8; // bit_depth_luma_minus8
        gb.readUEG(); // bit_depth_chroma_minus8
        gb.readBits(1); // qpprime_y_zero_transform_bypass_flag
        if (gb.readBool()) {
          // seq_scaling_matrix_present_flag
          var scaling_list_count = chroma_format_idc !== 3 ? 8 : 12;
          for (var i = 0; i < scaling_list_count; i++) {
            if (gb.readBool()) {
              // seq_scaling_list_present_flag
              if (i < 6) {
                SPSParser._skipScalingList(gb, 16);
              } else {
                SPSParser._skipScalingList(gb, 64);
              }
            }
          }
        }
      }
      gb.readUEG(); // log2_max_frame_num_minus4
      var pic_order_cnt_type = gb.readUEG();
      if (pic_order_cnt_type === 0) {
        gb.readUEG(); // log2_max_pic_order_cnt_lsb_minus_4
      } else if (pic_order_cnt_type === 1) {
        gb.readBits(1); // delta_pic_order_always_zero_flag
        gb.readSEG(); // offset_for_non_ref_pic
        gb.readSEG(); // offset_for_top_to_bottom_field
        var num_ref_frames_in_pic_order_cnt_cycle = gb.readUEG();
        for (var _i = 0; _i < num_ref_frames_in_pic_order_cnt_cycle; _i++) {
          gb.readSEG(); // offset_for_ref_frame
        }
      }
      gb.readUEG(); // max_num_ref_frames
      gb.readBits(1); // gaps_in_frame_num_value_allowed_flag

      var pic_width_in_mbs_minus1 = gb.readUEG();
      var pic_height_in_map_units_minus1 = gb.readUEG();

      var frame_mbs_only_flag = gb.readBits(1);
      if (frame_mbs_only_flag === 0) {
        gb.readBits(1); // mb_adaptive_frame_field_flag
      }
      gb.readBits(1); // direct_8x8_inference_flag

      var frame_crop_left_offset = 0;
      var frame_crop_right_offset = 0;
      var frame_crop_top_offset = 0;
      var frame_crop_bottom_offset = 0;

      var frame_cropping_flag = gb.readBool();
      if (frame_cropping_flag) {
        frame_crop_left_offset = gb.readUEG();
        frame_crop_right_offset = gb.readUEG();
        frame_crop_top_offset = gb.readUEG();
        frame_crop_bottom_offset = gb.readUEG();
      }

      var sar_width = 1,
          sar_height = 1;
      var fps = 0,
          fps_fixed = true,
          fps_num = 0,
          fps_den = 0;

      var vui_parameters_present_flag = gb.readBool();
      if (vui_parameters_present_flag) {
        if (gb.readBool()) {
          // aspect_ratio_info_present_flag
          var aspect_ratio_idc = gb.readByte();
          var sar_w_table = [1, 12, 10, 16, 40, 24, 20, 32, 80, 18, 15, 64, 160, 4, 3, 2];
          var sar_h_table = [1, 11, 11, 11, 33, 11, 11, 11, 33, 11, 11, 33, 99, 3, 2, 1];

          if (aspect_ratio_idc > 0 && aspect_ratio_idc < 16) {
            sar_width = sar_w_table[aspect_ratio_idc - 1];
            sar_height = sar_h_table[aspect_ratio_idc - 1];
          } else if (aspect_ratio_idc === 255) {
            sar_width = gb.readByte() << 8 | gb.readByte();
            sar_height = gb.readByte() << 8 | gb.readByte();
          }
        }

        if (gb.readBool()) {
          // overscan_info_present_flag
          gb.readBool(); // overscan_appropriate_flag
        }
        if (gb.readBool()) {
          // video_signal_type_present_flag
          gb.readBits(4); // video_format & video_full_range_flag
          if (gb.readBool()) {
            // colour_description_present_flag
            gb.readBits(24); // colour_primaries & transfer_characteristics & matrix_coefficients
          }
        }
        if (gb.readBool()) {
          // chroma_loc_info_present_flag
          gb.readUEG(); // chroma_sample_loc_type_top_field
          gb.readUEG(); // chroma_sample_loc_type_bottom_field
        }
        if (gb.readBool()) {
          // timing_info_present_flag
          var num_units_in_tick = gb.readBits(32);
          var time_scale = gb.readBits(32);
          fps_fixed = gb.readBool(); // fixed_frame_rate_flag

          fps_num = time_scale;
          fps_den = num_units_in_tick * 2;
          fps = fps_num / fps_den;
        }
      }

      var sarScale = 1;
      if (sar_width !== 1 || sar_height !== 1) {
        sarScale = sar_width / sar_height;
      }

      var crop_unit_x = 0,
          crop_unit_y = 0;
      if (chroma_format_idc === 0) {
        crop_unit_x = 1;
        crop_unit_y = 2 - frame_mbs_only_flag;
      } else {
        var sub_wc = chroma_format_idc === 3 ? 1 : 2;
        var sub_hc = chroma_format_idc === 1 ? 2 : 1;
        crop_unit_x = sub_wc;
        crop_unit_y = sub_hc * (2 - frame_mbs_only_flag);
      }

      var codec_width = (pic_width_in_mbs_minus1 + 1) * 16;
      var codec_height = (2 - frame_mbs_only_flag) * ((pic_height_in_map_units_minus1 + 1) * 16);

      codec_width -= (frame_crop_left_offset + frame_crop_right_offset) * crop_unit_x;
      codec_height -= (frame_crop_top_offset + frame_crop_bottom_offset) * crop_unit_y;

      var present_width = Math.ceil(codec_width * sarScale);

      gb.destroy();
      gb = null;

      return {
        profile_string: profile_string, // baseline, high, high10, ...
        level_string: level_string, // 3, 3.1, 4, 4.1, 5, 5.1, ...
        bit_depth: bit_depth, // 8bit, 10bit, ...
        chroma_format: chroma_format, // 4:2:0, 4:2:2, ...
        chroma_format_string: SPSParser.getChromaFormatString(chroma_format),

        frame_rate: {
          fixed: fps_fixed,
          fps: fps,
          fps_den: fps_den,
          fps_num: fps_num
        },

        sar_ratio: {
          width: sar_width,
          height: sar_height
        },

        codec_size: {
          width: codec_width,
          height: codec_height
        },

        present_size: {
          width: present_width,
          height: codec_height
        }
      };
    }
  }, {
    key: '_skipScalingList',
    value: function _skipScalingList(gb, count) {
      var last_scale = 8,
          next_scale = 8;
      var delta_scale = 0;
      for (var i = 0; i < count; i++) {
        if (next_scale !== 0) {
          delta_scale = gb.readSEG();
          next_scale = (last_scale + delta_scale + 256) % 256;
        }
        last_scale = next_scale === 0 ? last_scale : next_scale;
      }
    }
  }, {
    key: 'getProfileString',
    value: function getProfileString(profile_idc) {
      switch (profile_idc) {
        case 66:
          return 'Baseline';
        case 77:
          return 'Main';
        case 88:
          return 'Extended';
        case 100:
          return 'High';
        case 110:
          return 'High10';
        case 122:
          return 'High422';
        case 244:
          return 'High444';
        default:
          return 'Unknown';
      }
    }
  }, {
    key: 'getLevelString',
    value: function getLevelString(level_idc) {
      return (level_idc / 10).toFixed(1);
    }
  }, {
    key: 'getChromaFormatString',
    value: function getChromaFormatString(chroma) {
      switch (chroma) {
        case 420:
          return '4:2:0';
        case 422:
          return '4:2:2';
        case 444:
          return '4:4:4';
        default:
          return 'Unknown';
      }
    }
  }]);

  return SPSParser;
}();

var ExpGolomb = function () {
  function ExpGolomb(uint8array) {
    _classCallCheck(this, ExpGolomb);

    this.TAG = 'ExpGolomb';

    this._buffer = uint8array;
    this._buffer_index = 0;
    this._total_bytes = uint8array.byteLength;
    this._total_bits = uint8array.byteLength * 8;
    this._current_word = 0;
    this._current_word_bits_left = 0;
  }

  _createClass(ExpGolomb, [{
    key: 'destroy',
    value: function destroy() {
      this._buffer = null;
    }
  }, {
    key: '_fillCurrentWord',
    value: function _fillCurrentWord() {
      var buffer_bytes_left = this._total_bytes - this._buffer_index;
      if (buffer_bytes_left <= 0) throw new IllegalStateException('ExpGolomb: _fillCurrentWord() but no bytes available');

      var bytes_read = Math.min(4, buffer_bytes_left);
      var word = new Uint8Array(4);
      word.set(this._buffer.subarray(this._buffer_index, this._buffer_index + bytes_read));
      this._current_word = new DataView(word.buffer).getUint32(0, false);

      this._buffer_index += bytes_read;
      this._current_word_bits_left = bytes_read * 8;
    }
  }, {
    key: 'readBits',
    value: function readBits(bits) {
      if (bits > 32) throw new InvalidArgumentException('ExpGolomb: readBits() bits exceeded max 32bits!');

      if (bits <= this._current_word_bits_left) {
        var _result = this._current_word >>> 32 - bits;
        this._current_word <<= bits;
        this._current_word_bits_left -= bits;
        return _result;
      }

      var result = this._current_word_bits_left ? this._current_word : 0;
      result = result >>> 32 - this._current_word_bits_left;
      var bits_need_left = bits - this._current_word_bits_left;

      this._fillCurrentWord();
      var bits_read_next = Math.min(bits_need_left, this._current_word_bits_left);

      var result2 = this._current_word >>> 32 - bits_read_next;
      this._current_word <<= bits_read_next;
      this._current_word_bits_left -= bits_read_next;

      result = result << bits_read_next | result2;
      return result;
    }
  }, {
    key: 'readBool',
    value: function readBool() {
      return this.readBits(1) === 1;
    }
  }, {
    key: 'readByte',
    value: function readByte() {
      return this.readBits(8);
    }
  }, {
    key: '_skipLeadingZero',
    value: function _skipLeadingZero() {
      var zero_count = void 0;
      for (zero_count = 0; zero_count < this._current_word_bits_left; zero_count++) {
        if (0 !== (this._current_word & 0x80000000 >>> zero_count)) {
          this._current_word <<= zero_count;
          this._current_word_bits_left -= zero_count;
          return zero_count;
        }
      }
      this._fillCurrentWord();
      return zero_count + this._skipLeadingZero();
    }
  }, {
    key: 'readUEG',
    value: function readUEG() {
      // unsigned exponential golomb
      var leading_zeros = this._skipLeadingZero();
      return this.readBits(leading_zeros + 1) - 1;
    }
  }, {
    key: 'readSEG',
    value: function readSEG() {
      // signed exponential golomb
      var value = this.readUEG();
      if (value & 0x01) {
        return value + 1 >>> 1;
      } else {
        return -1 * (value >>> 1);
      }
    }
  }]);

  return ExpGolomb;
}();

var containerBox = ['moov', 'trak', 'mdia', 'minf', 'stbl', 'moof', 'traf'];
function parseMoov(parent, data, index, length) {
  var offset = 0;
  while (offset < length) {
    var box = boxInfo(data, index + offset);
    if (containerBox.indexOf(box.name) !== -1) {
      parent[box.name] = parent[box.name] || [];
      parent[box.name].push({});
      parseMoov(parent[box.name][parent[box.name].length - 1], data, index + offset + 8, box.size - 8);
    } else {
      var body = void 0;
      switch (box.name) {
        case 'mvhd':
          {
            /*
            mvhd struct
            version 1   0
            flags   3   1
            create  4   4
            modifi  4   8
            Tscale  4   12
            dura    4   16
            rate    4   20
            volume  2   24
            reserve 10  26
            matrik  36  36
            preT    4   72
            preD    4   76
            poster  4   80
            selectT 4   84
            selectD 4   88
            current 4   92
            nextID  4   96
            */
            body = new Uint8Array(data.buffer, data.byteOffset + index + offset + 8, box.size - 8);
            var version = body[0];
            var timeScale = ReadBig32(body, version == 1 ? 20 : 12);
            var duration = version == 1 ? ReadBig64(body, 24) : ReadBig32(body, 16);
            parent[box.name] = {
              version: version,
              timeScale: timeScale,
              duration: duration
            };
            break;
          }
        case 'tkhd':
          {
            /*
            tkhd struct
            version 1   0
            flags   3   1
            create  4   4
            modifi  4   8
            trackID 4   12
            reserve 4   16
            dura    4   20
            reserve 8   24
            layer   2   32
            group   2   34
            volume  2   36
            reserve 2   38
            matrix  36  40
            Twidth  4   76
            Theight 4   80
            */
            body = new Uint8Array(data.buffer, data.byteOffset + index + offset + 8, box.size - 8);
            var flags = {
              trackEnbaled: body[3] & 1,
              trackInMovie: (body[3] & 2) >> 1,
              trackInPreview: (body[3] & 4) >> 2,
              trackInPoster: (body[3] & 8) >> 3
            };
            var trackID = ReadBig32(body, 12);
            var _duration = ReadBig32(body, 20);
            var group = ReadBig16(body, 34);
            var trackWidth = parseFloat(ReadBig16(body, 72) + '.' + ReadBig16(body, 74));
            var trackHeight = parseFloat(ReadBig16(body, 76) + '.' + ReadBig16(body, 78));

            parent[box.name] = {
              flags: flags,
              trackID: trackID,
              duration: _duration,
              group: group,
              trackWidth: trackWidth,
              trackHeight: trackHeight
            };
            break;
          }
        case 'mdhd':
          {
            /*
            mdhd struct
            version 1   0
            flags   3   1
            create  4   4
            modifi  4   8
            Tscale  4   12
            dura    4   16
            lang    2   20
            quality 2   22
            */
            body = new Uint8Array(data.buffer, data.byteOffset + index + offset + 8, box.size - 8);
            var _version = body[0];
            var boxOffset = _version == 1 ? 24 : 16;
            var _duration2 = (_version == 1 ? ReadBig64 : ReadBig32)(body, boxOffset);
            boxOffset += _version == 1 ? 8 : 4;
            var language = ReadBig16(body, boxOffset);

            parent[box.name] = {
              version: _version,
              duration: _duration2,
              language: language
            };
            break;
          }
        case 'stsd':
          {
            parent[box.name] = parent[box.name] || [];
            parent[box.name].push({});
            parseMoov(parent[box.name][parent[box.name].length - 1], data, index + offset + 16, box.size - 16);
            break;
          }
        case 'avc1':
          {
            body = new Uint8Array(data.buffer, data.byteOffset + index + offset + 8, box.size - 8);
            var dataReferenceIndex = ReadBig32(body, 4);
            var _version2 = ReadBig16(body, 8);
            var revisionLevel = ReadBig16(body, 10);
            var vendor = ReadBig32(body, 12);
            var temporalQuality = ReadBig32(body, 16);
            var spatialQuality = ReadBig32(body, 20);
            var width = ReadBig16(body, 24);
            var height = ReadBig16(body, 26);
            var horizontalResolution = parseFloat(ReadBig16(body, 28) + '.' + ReadBig16(body, 30));
            var verticalResolution = parseFloat(ReadBig16(body, 32) + '.' + ReadBig16(body, 34));
            var dataSize = ReadBig32(body, 36);
            var frameCount = ReadBig16(body, 40);
            var compressorName = ReadString(body, 42, 32);
            var depth = ReadBig16(body, 74);
            var colorTableID = ReadBig16(body, 76);

            parent[box.name] = {
              dataReferenceIndex: dataReferenceIndex,
              version: _version2,
              revisionLevel: revisionLevel,
              vendor: vendor,
              temporalQuality: temporalQuality,
              spatialQuality: spatialQuality,
              width: width,
              height: height,
              horizontalResolution: horizontalResolution,
              verticalResolution: verticalResolution,
              dataSize: dataSize,
              frameCount: frameCount,
              compressorName: compressorName,
              depth: depth,
              colorTableID: colorTableID,
              extensions: {}
            };
            parseMoov(parent[box.name].extensions, data, index + offset + 86, box.size - 86);
            break;
          }
        case 'avcC':
          {
            body = new Uint8Array(data.buffer, data.byteOffset + index + offset + 8, box.size - 8);
            var configurationVersion = body[0];
            var avcProfileIndication = body[1];
            var profile_compatibility = body[2];
            var AVCLevelIndication = body[3];
            var lengthSizeMinusOne = body[4] & 0x3;
            var nb_nalus = body[5] & 0x1f;
            var SPS = new Array(nb_nalus);
            var recordLength = void 0;
            var _boxOffset = 6;
            for (var i = 0; i < nb_nalus; i++) {
              recordLength = ReadBig16(body, _boxOffset);
              _boxOffset += 2;
              SPS[i] = SPSParser.parseSPS(new Uint8Array(data.buffer, data.byteOffset + index + offset + 8 + _boxOffset, recordLength));
              var codecString = 'avc1.';
              var codecArray = body.subarray(_boxOffset + 1, _boxOffset + 4);
              for (var j = 0; j < 3; j++) {
                var h = codecArray[j].toString(16);
                if (h.length < 2) {
                  h = '0' + h;
                }
                codecString += h;
              }
              SPS[i].codecString = codecString;
              _boxOffset += recordLength;
            }
            nb_nalus = body[_boxOffset];
            var PPS = new Array(nb_nalus);
            _boxOffset++;
            for (var _i2 = 0; _i2 < nb_nalus; _i2++) {
              recordLength = ReadBig16(body, offset);
              _boxOffset += 2;
              //ignoring PPS
              _boxOffset += recordLength;
            }
            parent[box.name] = {
              configurationVersion: configurationVersion,
              avcProfileIndication: avcProfileIndication,
              profile_compatibility: profile_compatibility,
              AVCLevelIndication: AVCLevelIndication,
              lengthSizeMinusOne: lengthSizeMinusOne,
              SPS: SPS,
              data: body
            };
            break;
          }
        case 'mp4a':
          {
            body = new Uint8Array(data.buffer, data.byteOffset + index + offset + 8, box.size - 8);
            var _dataReferenceIndex = ReadBig32(body, 4);
            var _version3 = ReadBig16(body, 8);
            var _revisionLevel = ReadBig16(body, 10);
            var _vendor = ReadBig32(body, 12);
            var channels = ReadBig16(body, 16);
            var sampleSize = ReadBig16(body, 18);
            var compressionID = ReadBig16(body, 20);
            var packetSize = ReadBig16(body, 22);
            var sampleRate = ReadBig16(body, 24);
            //unknown two bytes here???
            parent[box.name] = {
              dataReferenceIndex: _dataReferenceIndex,
              version: _version3,
              revisionLevel: _revisionLevel,
              vendor: _vendor,
              channels: channels,
              sampleSize: sampleSize,
              compressionID: compressionID,
              packetSize: packetSize,
              sampleRate: sampleRate,
              extensions: {}
            };
            parseMoov(parent[box.name].extensions, data, index + offset + 36, box.size - 36);
            break;
          }
        case 'esds':
          {
            body = new Uint8Array(data.buffer, data.byteOffset + index + offset + 8, box.size - 8);
            var esdsData = {};
            esdsParse(esdsData, body, 4);
            parent[box.name] = esdsData;
            break;
          }
        case 'stts':
          {
            body = new Uint8Array(data.buffer, data.byteOffset + index + offset + 12, box.size - 12);
            var entryCount = ReadBig32(body, 0);
            var sampleTable = [];
            var _boxOffset2 = 4;
            for (var _i3 = 0; _i3 < entryCount; _i3++) {
              var sampleCount = ReadBig32(body, _boxOffset2);
              var sampleDuration = ReadBig32(body, _boxOffset2 + 4);
              sampleTable.push({
                sampleCount: sampleCount, sampleDuration: sampleDuration
              });
              _boxOffset2 += 8;
            }
            parent[box.name] = sampleTable;
            break;
          }
        case 'ctts':
          {
            body = new Uint8Array(data.buffer, data.byteOffset + index + offset + 12, box.size - 12);
            var _entryCount = ReadBig32(body, 0);
            var _sampleTable = [];
            var _boxOffset3 = 4;
            for (var _i4 = 0; _i4 < _entryCount; _i4++) {
              var _sampleCount = ReadBig32(body, _boxOffset3);
              var compositionOffset = ReadBig32(body, _boxOffset3 + 4);
              _sampleTable.push({
                sampleCount: _sampleCount, compositionOffset: compositionOffset
              });
              _boxOffset3 += 8;
            }
            parent[box.name] = _sampleTable;
            break;
          }
        case 'stss':
          {
            body = new Uint8Array(data.buffer, data.byteOffset + index + offset + 12, box.size - 12);
            var _entryCount2 = ReadBig32(body, 0);
            var _sampleTable2 = new Uint32Array(_entryCount2);
            var _boxOffset4 = 4;
            for (var _i5 = 0; _i5 < _entryCount2; _i5++) {
              _sampleTable2[_i5] = ReadBig32(body, _boxOffset4);
              _boxOffset4 += 4;
            }
            parent[box.name] = _sampleTable2;
            break;
          }
        case 'stsc':
          {
            body = new Uint8Array(data.buffer, data.byteOffset + index + offset + 12, box.size - 12);
            var _entryCount3 = ReadBig32(body, 0);
            var _sampleTable3 = [];
            var _boxOffset5 = 4;
            for (var _i6 = 0; _i6 < _entryCount3; _i6++) {
              var firstChunk = ReadBig32(body, _boxOffset5);
              var samplesPerChunk = ReadBig32(body, _boxOffset5 + 4);
              var sampleDescID = ReadBig32(body, _boxOffset5 + 8);
              _sampleTable3.push({
                firstChunk: firstChunk, samplesPerChunk: samplesPerChunk, sampleDescID: sampleDescID
              });
              _boxOffset5 += 12;
            }
            parent[box.name] = _sampleTable3;
            break;
          }
        case 'stsz':
          {
            body = new Uint8Array(data.buffer, data.byteOffset + index + offset + 12, box.size - 12);
            var _sampleSize = ReadBig32(body, 0);
            var _entryCount4 = ReadBig32(body, 4);
            var _sampleTable4 = new Uint32Array(_entryCount4);
            var _boxOffset6 = 8;
            for (var _i7 = 0; _i7 < _entryCount4; _i7++) {
              _sampleTable4[_i7] = ReadBig32(body, _boxOffset6);
              _boxOffset6 += 4;
            }
            parent[box.name] = {
              sampleSize: _sampleSize,
              sampleTable: _sampleTable4
            };
            break;
          }
        case 'stco':
          {
            body = new Uint8Array(data.buffer, data.byteOffset + index + offset + 12, box.size - 12);
            var _entryCount5 = ReadBig32(body, 0);
            var _sampleTable5 = new Uint32Array(_entryCount5);
            var _boxOffset7 = 4;
            for (var _i8 = 0; _i8 < _entryCount5; _i8++) {
              _sampleTable5[_i8] = ReadBig32(body, _boxOffset7);
              _boxOffset7 += 4;
            }
            parent[box.name] = _sampleTable5;
            break;
          }
        case 'co64':
          {
            body = new Uint8Array(data.buffer, data.byteOffset + index + offset + 12, box.size - 12);
            var _entryCount6 = ReadBig32(body, 0);
            var _sampleTable6 = new Float64Array(_entryCount6);
            var _boxOffset8 = 4;
            for (var _i9 = 0; _i9 < _entryCount6; _i9++) {
              _sampleTable6[_i9] = ReadBig64(body, _boxOffset8);
              _boxOffset8 += 8;
            }
            parent['stco'] = _sampleTable6;
            break;
          }
        case 'hdlr':
          {
            body = new Uint8Array(data.buffer, data.byteOffset + index + offset + 12, box.size - 12);
            var handler = ReadString(body, 4, 4);
            parent[box.name] = {
              handler: handler
            };
            break;
          }
        case 'tfdt':
          {
            body = new Uint8Array(data.buffer, data.byteOffset + index + offset + 8, box.size - 8);
            var _version4 = body[0];
            var baseMediaDecodeTime = (_version4 == 1 ? ReadBig64 : ReadBig32)(body, 4);
            parent['tfdt'] = {
              baseMediaDecodeTime: baseMediaDecodeTime
            };
            break;
          }
        case 'trun':
          {
            body = new Uint8Array(data.buffer, data.byteOffset + index + offset + 12, box.size - 12);
            var _sampleCount2 = ReadBig32(body, 0);
            var durations = new Uint32Array(_sampleCount2);
            var sizes = new Uint32Array(_sampleCount2);
            var _boxOffset9 = 8;
            for (var _i10 = 0; _i10 < _sampleCount2; _i10++) {
              durations[_i10] = ReadBig32(body, _boxOffset9);
              sizes[_i10] = ReadBig32(body, _boxOffset9 + 4);
              _boxOffset9 += 16;
            }
            parent['trun'] = {
              sampleCount: _sampleCount2,
              durations: durations,
              sizes: sizes
            };
            break;
          }
        default:
          {
            //parent[box.name] = box;
          }
      }
    }
    offset += box.size;
  }
}

function boxInfo(uintarr, index) {
  var boxSize = ReadBig32(uintarr, index);
  var boxName = ReadString(uintarr, index + 4, 4);
  var boxHeadSize = 8;
  if (boxSize == 1) {
    boxSize = ReadBig64(uintarr, index + 8);
    boxHeadSize = 16;
  }
  var fullyLoaded = uintarr.length >= index + boxSize;
  if (boxSize == 0) return {
    size: 8,
    headSize: boxHeadSize,
    name: '',
    fullyLoaded: true
  };
  return {
    size: boxSize,
    headSize: boxHeadSize,
    name: boxName,
    fullyLoaded: fullyLoaded
  };
}

/**
 * avl v1.4.4
 * Fast AVL tree for Node and browser
 *
 * @author Alexander Milevski <info@w8r.name>
 * @license MIT
 * @preserve
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.AVLTree = factory());
}(this, (function () { 'use strict';

  /**
   * Prints tree horizontally
   * @param  {Node}                       root
   * @param  {Function(node:Node):String} [printNode]
   * @return {String}
   */
  function print (root, printNode) {
    if ( printNode === void 0 ) printNode = function (n) { return n.key; };

    var out = [];
    row(root, '', true, function (v) { return out.push(v); }, printNode);
    return out.join('');
  }

  /**
   * Prints level of the tree
   * @param  {Node}                        root
   * @param  {String}                      prefix
   * @param  {Boolean}                     isTail
   * @param  {Function(in:string):void}    out
   * @param  {Function(node:Node):String}  printNode
   */
  function row (root, prefix, isTail, out, printNode) {
    if (root) {
      out(("" + prefix + (isTail ? '└── ' : '├── ') + (printNode(root)) + "\n"));
      var indent = prefix + (isTail ? '    ' : '│   ');
      if (root.left)  { row(root.left,  indent, false, out, printNode); }
      if (root.right) { row(root.right, indent, true,  out, printNode); }
    }
  }


  /**
   * Is the tree balanced (none of the subtrees differ in height by more than 1)
   * @param  {Node}    root
   * @return {Boolean}
   */
  function isBalanced(root) {
    if (root === null) { return true; } // If node is empty then return true

    // Get the height of left and right sub trees
    var lh = height(root.left);
    var rh = height(root.right);

    if (Math.abs(lh - rh) <= 1 &&
        isBalanced(root.left)  &&
        isBalanced(root.right)) { return true; }

    // If we reach here then tree is not height-balanced
    return false;
  }

  /**
   * The function Compute the 'height' of a tree.
   * Height is the number of nodes along the longest path
   * from the root node down to the farthest leaf node.
   *
   * @param  {Node} node
   * @return {Number}
   */
  function height(node) {
    return node ? (1 + Math.max(height(node.left), height(node.right))) : 0;
  }


  function loadRecursive (parent, keys, values, start, end) {
    var size = end - start;
    if (size > 0) {
      var middle = start + Math.floor(size / 2);
      var key    = keys[middle];
      var data   = values[middle];
      var node   = { key: key, data: data, parent: parent };
      node.left    = loadRecursive(node, keys, values, start, middle);
      node.right   = loadRecursive(node, keys, values, middle + 1, end);
      return node;
    }
    return null;
  }


  function markBalance(node) {
    if (node === null) { return 0; }
    var lh = markBalance(node.left);
    var rh = markBalance(node.right);

    node.balanceFactor = lh - rh;
    return Math.max(lh, rh) + 1;
  }


  function sort(keys, values, left, right, compare) {
    if (left >= right) { return; }

    // eslint-disable-next-line no-bitwise
    var pivot = keys[(left + right) >> 1];
    var i = left - 1;
    var j = right + 1;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      do { i++; } while (compare(keys[i], pivot) < 0);
      do { j--; } while (compare(keys[j], pivot) > 0);
      if (i >= j) { break; }

      var tmp = keys[i];
      keys[i] = keys[j];
      keys[j] = tmp;

      tmp = values[i];
      values[i] = values[j];
      values[j] = tmp;
    }

    sort(keys, values,  left,     j, compare);
    sort(keys, values, j + 1, right, compare);
  }

  // function createNode (parent, left, right, height, key, data) {
  //   return { parent, left, right, balanceFactor: height, key, data };
  // }

  /**
   * @typedef {{
   *   parent:        ?Node,
   *   left:          ?Node,
   *   right:         ?Node,
   *   balanceFactor: number,
   *   key:           Key,
   *   data:          Value
   * }} Node
   */

  /**
   * @typedef {*} Key
   */

  /**
   * @typedef {*} Value
   */

  /**
   * Default comparison function
   * @param {Key} a
   * @param {Key} b
   * @returns {number}
   */
  function DEFAULT_COMPARE (a, b) { return a > b ? 1 : a < b ? -1 : 0; }


  /**
   * Single left rotation
   * @param  {Node} node
   * @return {Node}
   */
  function rotateLeft (node) {
    var rightNode = node.right;
    node.right    = rightNode.left;

    if (rightNode.left) { rightNode.left.parent = node; }

    rightNode.parent = node.parent;
    if (rightNode.parent) {
      if (rightNode.parent.left === node) {
        rightNode.parent.left = rightNode;
      } else {
        rightNode.parent.right = rightNode;
      }
    }

    node.parent    = rightNode;
    rightNode.left = node;

    node.balanceFactor += 1;
    if (rightNode.balanceFactor < 0) {
      node.balanceFactor -= rightNode.balanceFactor;
    }

    rightNode.balanceFactor += 1;
    if (node.balanceFactor > 0) {
      rightNode.balanceFactor += node.balanceFactor;
    }
    return rightNode;
  }


  function rotateRight (node) {
    var leftNode = node.left;
    node.left = leftNode.right;
    if (node.left) { node.left.parent = node; }

    leftNode.parent = node.parent;
    if (leftNode.parent) {
      if (leftNode.parent.left === node) {
        leftNode.parent.left = leftNode;
      } else {
        leftNode.parent.right = leftNode;
      }
    }

    node.parent    = leftNode;
    leftNode.right = node;

    node.balanceFactor -= 1;
    if (leftNode.balanceFactor > 0) {
      node.balanceFactor -= leftNode.balanceFactor;
    }

    leftNode.balanceFactor -= 1;
    if (node.balanceFactor < 0) {
      leftNode.balanceFactor += node.balanceFactor;
    }

    return leftNode;
  }


  // function leftBalance (node) {
  //   if (node.left.balanceFactor === -1) rotateLeft(node.left);
  //   return rotateRight(node);
  // }


  // function rightBalance (node) {
  //   if (node.right.balanceFactor === 1) rotateRight(node.right);
  //   return rotateLeft(node);
  // }


  var AVLTree = function AVLTree (comparator, noDuplicates) {
    if ( noDuplicates === void 0 ) noDuplicates = false;

    this._comparator = comparator || DEFAULT_COMPARE;
    this._root = null;
    this._size = 0;
    this._noDuplicates = !!noDuplicates;
  };

  var prototypeAccessors = { size: { configurable: true } };


  /**
   * Clear the tree
   * @return {AVLTree}
   */
  AVLTree.prototype.destroy = function destroy () {
    return this.clear();
  };


  /**
   * Clear the tree
   * @return {AVLTree}
   */
  AVLTree.prototype.clear = function clear () {
    this._root = null;
    this._size = 0;
    return this;
  };

  /**
   * Number of nodes
   * @return {number}
   */
  prototypeAccessors.size.get = function () {
    return this._size;
  };


  /**
   * Whether the tree contains a node with the given key
   * @param{Key} key
   * @return {boolean} true/false
   */
  AVLTree.prototype.contains = function contains (key) {
    if (this._root){
      var node     = this._root;
      var comparator = this._comparator;
      while (node){
        var cmp = comparator(key, node.key);
        if    (cmp === 0) { return true; }
        else if (cmp < 0) { node = node.left; }
        else              { node = node.right; }
      }
    }
    return false;
  };


  /* eslint-disable class-methods-use-this */

  /**
   * Successor node
   * @param{Node} node
   * @return {?Node}
   */
  AVLTree.prototype.next = function next (node) {
    var successor = node;
    if (successor) {
      if (successor.right) {
        successor = successor.right;
        while (successor.left) { successor = successor.left; }
      } else {
        successor = node.parent;
        while (successor && successor.right === node) {
          node = successor; successor = successor.parent;
        }
      }
    }
    return successor;
  };


  /**
   * Predecessor node
   * @param{Node} node
   * @return {?Node}
   */
  AVLTree.prototype.prev = function prev (node) {
    var predecessor = node;
    if (predecessor) {
      if (predecessor.left) {
        predecessor = predecessor.left;
        while (predecessor.right) { predecessor = predecessor.right; }
      } else {
        predecessor = node.parent;
        while (predecessor && predecessor.left === node) {
          node = predecessor;
          predecessor = predecessor.parent;
        }
      }
    }
    return predecessor;
  };
  /* eslint-enable class-methods-use-this */


  /**
   * Callback for forEach
   * @callback forEachCallback
   * @param {Node} node
   * @param {number} index
   */

  /**
   * @param{forEachCallback} callback
   * @return {AVLTree}
   */
  AVLTree.prototype.forEach = function forEach (callback) {
    var current = this._root;
    var s = [], done = false, i = 0;

    while (!done) {
      // Reach the left most Node of the current Node
      if (current) {
        // Place pointer to a tree node on the stack
        // before traversing the node's left subtree
        s.push(current);
        current = current.left;
      } else {
        // BackTrack from the empty subtree and visit the Node
        // at the top of the stack; however, if the stack is
        // empty you are done
        if (s.length > 0) {
          current = s.pop();
          callback(current, i++);

          // We have visited the node and its left
          // subtree. Now, it's right subtree's turn
          current = current.right;
        } else { done = true; }
      }
    }
    return this;
  };


  /**
   * Walk key range from `low` to `high`. Stops if `fn` returns a value.
   * @param{Key}    low
   * @param{Key}    high
   * @param{Function} fn
   * @param{*?}     ctx
   * @return {SplayTree}
   */
  AVLTree.prototype.range = function range (low, high, fn, ctx) {
      var this$1 = this;

    var Q = [];
    var compare = this._comparator;
    var node = this._root, cmp;

    while (Q.length !== 0 || node) {
      if (node) {
        Q.push(node);
        node = node.left;
      } else {
        node = Q.pop();
        cmp = compare(node.key, high);
        if (cmp > 0) {
          break;
        } else if (compare(node.key, low) >= 0) {
          if (fn.call(ctx, node)) { return this$1; } // stop if smth is returned
        }
        node = node.right;
      }
    }
    return this;
  };


  /**
   * Returns all keys in order
   * @return {Array<Key>}
   */
  AVLTree.prototype.keys = function keys () {
    var current = this._root;
    var s = [], r = [], done = false;

    while (!done) {
      if (current) {
        s.push(current);
        current = current.left;
      } else {
        if (s.length > 0) {
          current = s.pop();
          r.push(current.key);
          current = current.right;
        } else { done = true; }
      }
    }
    return r;
  };


  /**
   * Returns `data` fields of all nodes in order.
   * @return {Array<Value>}
   */
  AVLTree.prototype.values = function values () {
    var current = this._root;
    var s = [], r = [], done = false;

    while (!done) {
      if (current) {
        s.push(current);
        current = current.left;
      } else {
        if (s.length > 0) {
          current = s.pop();
          r.push(current.data);
          current = current.right;
        } else { done = true; }
      }
    }
    return r;
  };


  /**
   * Returns node at given index
   * @param{number} index
   * @return {?Node}
   */
  AVLTree.prototype.at = function at (index) {
    // removed after a consideration, more misleading than useful
    // index = index % this.size;
    // if (index < 0) index = this.size - index;

    var current = this._root;
    var s = [], done = false, i = 0;

    while (!done) {
      if (current) {
        s.push(current);
        current = current.left;
      } else {
        if (s.length > 0) {
          current = s.pop();
          if (i === index) { return current; }
          i++;
          current = current.right;
        } else { done = true; }
      }
    }
    return null;
  };


  /**
   * Returns node with the minimum key
   * @return {?Node}
   */
  AVLTree.prototype.minNode = function minNode () {
    var node = this._root;
    if (!node) { return null; }
    while (node.left) { node = node.left; }
    return node;
  };


  /**
   * Returns node with the max key
   * @return {?Node}
   */
  AVLTree.prototype.maxNode = function maxNode () {
    var node = this._root;
    if (!node) { return null; }
    while (node.right) { node = node.right; }
    return node;
  };


  /**
   * Min key
   * @return {?Key}
   */
  AVLTree.prototype.min = function min () {
    var node = this._root;
    if (!node) { return null; }
    while (node.left) { node = node.left; }
    return node.key;
  };


  /**
   * Max key
   * @return {?Key}
   */
  AVLTree.prototype.max = function max () {
    var node = this._root;
    if (!node) { return null; }
    while (node.right) { node = node.right; }
    return node.key;
  };


  /**
   * @return {boolean} true/false
   */
  AVLTree.prototype.isEmpty = function isEmpty () {
    return !this._root;
  };


  /**
   * Removes and returns the node with smallest key
   * @return {?Node}
   */
  AVLTree.prototype.pop = function pop () {
    var node = this._root, returnValue = null;
    if (node) {
      while (node.left) { node = node.left; }
      returnValue = { key: node.key, data: node.data };
      this.remove(node.key);
    }
    return returnValue;
  };


  /**
   * Find node by key
   * @param{Key} key
   * @return {?Node}
   */
  AVLTree.prototype.find = function find (key) {
    var root = this._root;
    // if (root === null)  return null;
    // if (key === root.key) return root;

    var subtree = root, cmp;
    var compare = this._comparator;
    while (subtree) {
      cmp = compare(key, subtree.key);
      if    (cmp === 0) { return subtree; }
      else if (cmp < 0) { subtree = subtree.left; }
      else              { subtree = subtree.right; }
    }

    return null;
  };


  /**
   * Insert a node into the tree
   * @param{Key} key
   * @param{Value} [data]
   * @return {?Node}
   */
  AVLTree.prototype.insert = function insert (key, data) {
      var this$1 = this;

    if (!this._root) {
      this._root = {
        parent: null, left: null, right: null, balanceFactor: 0,
        key: key, data: data
      };
      this._size++;
      return this._root;
    }

    var compare = this._comparator;
    var node  = this._root;
    var parent= null;
    var cmp   = 0;

    if (this._noDuplicates) {
      while (node) {
        cmp = compare(key, node.key);
        parent = node;
        if    (cmp === 0) { return null; }
        else if (cmp < 0) { node = node.left; }
        else              { node = node.right; }
      }
    } else {
      while (node) {
        cmp = compare(key, node.key);
        parent = node;
        if    (cmp <= 0){ node = node.left; } //return null;
        else              { node = node.right; }
      }
    }

    var newNode = {
      left: null,
      right: null,
      balanceFactor: 0,
      parent: parent, key: key, data: data
    };
    var newRoot;
    if (cmp <= 0) { parent.left= newNode; }
    else       { parent.right = newNode; }

    while (parent) {
      cmp = compare(parent.key, key);
      if (cmp < 0) { parent.balanceFactor -= 1; }
      else       { parent.balanceFactor += 1; }

      if      (parent.balanceFactor === 0) { break; }
      else if (parent.balanceFactor < -1) {
        // inlined
        //var newRoot = rightBalance(parent);
        if (parent.right.balanceFactor === 1) { rotateRight(parent.right); }
        newRoot = rotateLeft(parent);

        if (parent === this$1._root) { this$1._root = newRoot; }
        break;
      } else if (parent.balanceFactor > 1) {
        // inlined
        // var newRoot = leftBalance(parent);
        if (parent.left.balanceFactor === -1) { rotateLeft(parent.left); }
        newRoot = rotateRight(parent);

        if (parent === this$1._root) { this$1._root = newRoot; }
        break;
      }
      parent = parent.parent;
    }

    this._size++;
    return newNode;
  };


  /**
   * Removes the node from the tree. If not found, returns null.
   * @param{Key} key
   * @return {?Node}
   */
  AVLTree.prototype.remove = function remove (key) {
      var this$1 = this;

    if (!this._root) { return null; }

    var node = this._root;
    var compare = this._comparator;
    var cmp = 0;

    while (node) {
      cmp = compare(key, node.key);
      if    (cmp === 0) { break; }
      else if (cmp < 0) { node = node.left; }
      else              { node = node.right; }
    }
    if (!node) { return null; }

    var returnValue = node.key;
    var max, min;

    if (node.left) {
      max = node.left;

      while (max.left || max.right) {
        while (max.right) { max = max.right; }

        node.key = max.key;
        node.data = max.data;
        if (max.left) {
          node = max;
          max = max.left;
        }
      }

      node.key= max.key;
      node.data = max.data;
      node = max;
    }

    if (node.right) {
      min = node.right;

      while (min.left || min.right) {
        while (min.left) { min = min.left; }

        node.key= min.key;
        node.data = min.data;
        if (min.right) {
          node = min;
          min = min.right;
        }
      }

      node.key= min.key;
      node.data = min.data;
      node = min;
    }

    var parent = node.parent;
    var pp   = node;
    var newRoot;

    while (parent) {
      if (parent.left === pp) { parent.balanceFactor -= 1; }
      else                  { parent.balanceFactor += 1; }

      if      (parent.balanceFactor < -1) {
        // inlined
        //var newRoot = rightBalance(parent);
        if (parent.right.balanceFactor === 1) { rotateRight(parent.right); }
        newRoot = rotateLeft(parent);

        if (parent === this$1._root) { this$1._root = newRoot; }
        parent = newRoot;
      } else if (parent.balanceFactor > 1) {
        // inlined
        // var newRoot = leftBalance(parent);
        if (parent.left.balanceFactor === -1) { rotateLeft(parent.left); }
        newRoot = rotateRight(parent);

        if (parent === this$1._root) { this$1._root = newRoot; }
        parent = newRoot;
      }

      if (parent.balanceFactor === -1 || parent.balanceFactor === 1) { break; }

      pp   = parent;
      parent = parent.parent;
    }

    if (node.parent) {
      if (node.parent.left === node) { node.parent.left= null; }
      else                         { node.parent.right = null; }
    }

    if (node === this._root) { this._root = null; }

    this._size--;
    return returnValue;
  };


  /**
   * Bulk-load items
   * @param{Array<Key>}keys
   * @param{Array<Value>}[values]
   * @return {AVLTree}
   */
  AVLTree.prototype.load = function load (keys, values, presort) {
      if ( keys === void 0 ) keys = [];
      if ( values === void 0 ) values = [];

    if (this._size !== 0) { throw new Error('bulk-load: tree is not empty'); }
    var size = keys.length;
    if (presort) { sort(keys, values, 0, size - 1, this._comparator); }
    this._root = loadRecursive(null, keys, values, 0, size);
    markBalance(this._root);
    this._size = size;
    return this;
  };


  /**
   * Returns true if the tree is balanced
   * @return {boolean}
   */
  AVLTree.prototype.isBalanced = function isBalanced$1 () {
    return isBalanced(this._root);
  };


  /**
   * String representation of the tree - primitive horizontal print-out
   * @param{Function(Node):string} [printNode]
   * @return {string}
   */
  AVLTree.prototype.toString = function toString (printNode) {
    return print(this._root, printNode);
  };

  Object.defineProperties( AVLTree.prototype, prototypeAccessors );

  AVLTree.default = AVLTree;

  return AVLTree;

})));
//# sourceMappingURL=avl.js.map