# Copyright (c) 2026, Frappe Technologies Pvt. Ltd. and Contributors
# For license information, please see license.txt

from unittest.mock import patch

import frappe
from frappe.tests import UnitTestCase

from erpnext.setup.utils import get_exchange_rate


class TestReverseExchangeRate(UnitTestCase):
	def get_rate(self, records):
		def stored_rate(from_currency, to_currency, *args, **kwargs):
			return records.get((from_currency, to_currency))

		with (
			patch("erpnext.setup.utils.get_stored_exchange_rate", side_effect=stored_rate),
			patch("erpnext.setup.utils.frappe.get_cached_doc", return_value=frappe._dict(allow_stale=1)),
			patch("erpnext.setup.utils.frappe.get_single_value", return_value=1),
		):
			return get_exchange_rate("INR", "USD", "2031-03-10")

	def test_uses_inverse_of_reverse_record(self):
		self.assertAlmostEqual(self.get_rate({("USD", "INR"): 82.0}), 1 / 82)

	def test_direct_record_wins_over_reverse(self):
		self.assertEqual(self.get_rate({("INR", "USD"): 0.0125, ("USD", "INR"): 82.0}), 0.0125)

	def test_no_record_in_either_direction(self):
		self.assertEqual(self.get_rate({}), 0.0)
